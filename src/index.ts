type Callback = () => void | Promise<void>

function repaint(): void {
  console.log("[Render engine]: Rendering page changes...")
}

class Task {
  constructor(
    public callback: Callback,
    public ms: number,
  ) {}
}

class BinaryHeap<T extends Task> {
  private heap: T[] = []

  private parent(i: number): number {
    return Math.floor((i - 1) / 2)
  }

  private leftChild(i: number): number {
    return 2 * i + 1
  }

  private rightChild(i: number): number {
    return 2 * i + 2
  }

  private swap(i: number, j: number) {
    let temp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = temp
  }

  private heapifyUp() {
    let i = this.heap.length - 1
    while (
      this.parent(i) >= 0 &&
      this.heap[this.parent(i)].ms > this.heap[i].ms
    ) {
      this.swap(this.parent(i), i)
      i = this.parent(i)
    }
  }

  private heapifyDown() {
    let i = 0
    while (this.leftChild(i) < this.heap.length) {
      let smallerI = this.leftChild(i)
      if (
        this.rightChild(i) < this.heap.length &&
        this.heap[this.rightChild(i)].ms < this.heap[this.leftChild(i)].ms
      ) {
        smallerI = this.rightChild(i)
      }
      if (this.heap[smallerI].ms > this.heap[i].ms) {
        break
      } else {
        this.swap(smallerI, i)
      }
      i = smallerI
    }
  }

  public push(item: T): void {
    this.heap.push(item)
    this.heapifyUp()
  }

  public pop(): T | undefined {
    const item = this.heap.shift()
    this.heapifyDown()
    return item
  }

  get size(): number {
    return this.heap.length
  }

  public hasItems(): boolean {
    return this.heap.length > 0
  }

  public peek(): T {
    return this.heap[0]
  }
}

class EventLoop {
  private macroTaskQueue = new BinaryHeap<Task>()
  private microTaskQueue = new BinaryHeap<Task>()
  private animationQueue = new BinaryHeap<Task>()
  private lastPaintTime: number = Date.now()

  get isPainting(): boolean {
    // 60 times a second (every 16 ms)
    return Date.now() - this.lastPaintTime >= 16
  }

  public async queueMacroTask(callback: Callback, ms: number): Promise<void> {
    const task = new Task(callback, ms)
    return new Promise((resolve) => {
      setTimeout(() => {
        this.macroTaskQueue.push(task)
        resolve()
      }, ms)
    })
  }

  public async queueMicroTask(callback: Callback, ms: number): Promise<void> {
    const task = new Task(callback, ms)
    return Promise.resolve().then(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            this.microTaskQueue.push(task)
            resolve()
          }, ms)
        }),
    )
  }

  public async queueAnimationTask(
    callback: Callback,
    ms: number,
  ): Promise<void> {
    const task = new Task(callback, ms)
    return new Promise((resolve) => {
      setTimeout(() => {
        this.animationQueue.push(task)
        resolve()
      }, ms)
    })
  }

  public async empty() {
    console.log("[Event loop]: Started.")
    while (
      this.macroTaskQueue.hasItems() ||
      this.microTaskQueue.hasItems() ||
      this.animationQueue.hasItems()
    ) {
      if (this.macroTaskQueue.hasItems()) {
        const task = this.macroTaskQueue.pop()!
        await task.callback()
      }

      while (this.microTaskQueue.hasItems()) {
        const task = this.microTaskQueue.pop()!
        await task.callback()
      }

      if (this.isPainting) {
        while (this.animationQueue.hasItems()) {
          const task = this.animationQueue.pop()!
          await task.callback()
        }
        this.lastPaintTime = Date.now()
        repaint()
      }
    }
  }
}

async function getTasks(
  loop: EventLoop,
  options: { minDelay: number; maxDelay: number; quantity: number },
) {
  const { minDelay, maxDelay, quantity } = options

  if (minDelay > maxDelay) {
    throw new Error("Invalid options: minDelay, maxDelay")
  }

  const taskTypes = ["macro", "micro", "animation"] as const

  for (let i = 1; i < quantity; i++) {
    const ms = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay)
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)]

    switch (taskType) {
      case "macro":
        // Simulate a network request
        await loop.queueMacroTask(async () => {
          console.log(`[${i}] Macro task started: making network request...`)
          await new Promise((resolve) => setTimeout(resolve, ms))
          console.log(`[${i}] Macro task completed after ${ms} ms.`)
        }, ms)
        break

      case "micro":
        // Simulate a computation
        await loop.queueMicroTask(async () => {
          console.log(`[${i}] Micro task started: performing computation...`)
          let result = 0
          for (let j = 0; j < 1e6; j++) {
            result += j
          }
          console.log(`[${i}] Micro task completed: result is ${result}.`)
        }, ms)
        break

      case "animation":
        // Simulate a DOM manipulation
        await loop.queueAnimationTask(async () => {
          console.log(`[${i}] Animation task started: manipulating DOM...`)
          await new Promise((resolve) => setTimeout(resolve, ms))
          console.log(`[${i}] Animation task completed after ${ms} ms.`)
        }, ms)
        break
    }
  }
}

async function run() {
  const loop = new EventLoop()
  await getTasks(loop, { minDelay: 500, maxDelay: 1000, quantity: 8 })
  await loop
    .empty()
    .then(() => console.log("[Event loop]: Call stack empty, finished."))
    .catch((error) => {
      if (error instanceof Error) {
        console.error(error.message)
      }
    })
}

run()
