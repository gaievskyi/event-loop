interface Heap<T> {
  get size(): number
  get hasItems(): boolean
  push(item: T): void
  shift(): T
  peek(): T
}

export class BinaryHeap<T extends Task> implements Heap<T> {
  private readonly items: T[] = []

  constructor(private readonly capacity: number = Infinity) {}

  get size(): number {
    return this.items.length
  }

  get hasItems(): boolean {
    return this.size > 0
  }

  public push(item: T): void {
    if (this.size > this.capacity) throw new Error("Heap exceeded its capacity")
    this.items.push(item)
    this.heapifyUp()
  }

  public shift(): T {
    if (!this.hasItems) throw new Error("Heap is empty")
    const item = this.items.shift()
    if (!item) throw new Error("Something went wrong during the Heap shifting")
    this.heapifyDown()
    return item
  }

  public peek(): T {
    return this.items[0]
  }

  private parentOf(i: number): number {
    return Math.floor((i - 1) / 2)
  }

  private leftChild(i: number): number {
    return 2 * i + 1
  }

  private rightChild(i: number): number {
    return 2 * i + 2
  }

  private swap(i: number, j: number) {
    const temp = this.items[i]
    this.items[i] = this.items[j]
    this.items[j] = temp
  }

  private heapifyUp() {
    let i = this.size - 1
    while (
      this.parentOf(i) >= 0 &&
      this.items[this.parentOf(i)].ms > this.items[i].ms
    ) {
      this.swap(this.parentOf(i), i)
      i = this.parentOf(i)
    }
  }

  private heapifyDown() {
    let i = 0
    while (this.leftChild(i) < this.size) {
      let smallerI = this.leftChild(i)
      if (
        this.rightChild(i) < this.size &&
        this.items[this.rightChild(i)].ms < this.items[this.leftChild(i)].ms
      ) {
        smallerI = this.rightChild(i)
      }
      if (this.items[smallerI].ms > this.items[i].ms) {
        break
      } else {
        this.swap(smallerI, i)
      }
      i = smallerI
    }
  }
}

type AsyncCallback = () => Promise<void>
type SyncCallback = () => void
type Callback = SyncCallback | AsyncCallback

function repaint(): void {
  console.log("[Render engine]: Rendering page changes...")
}

class Task {
  constructor(
    public readonly callback: Callback,
    public readonly ms: number,
  ) {}
}

export class EventLoop {
  private readonly macroTaskQueue = new BinaryHeap<Task>(32)
  private readonly microTaskQueue = new BinaryHeap<Task>(32)
  private readonly animationQueue = new BinaryHeap<Task>(32)
  private lastPaintTime: number = Date.now()

  get isPainting(): boolean {
    // 60 times a second (every 16 ms)
    return Date.now() - this.lastPaintTime >= 16
  }

  get hasTasks(): boolean {
    return (
      this.macroTaskQueue.hasItems ||
      this.microTaskQueue.hasItems ||
      this.animationQueue.hasItems
    )
  }

  get hasMicroTask(): boolean {
    return this.microTaskQueue.hasItems
  }

  get hasMacroTask(): boolean {
    return this.macroTaskQueue.hasItems
  }

  get hasAnimationTask(): boolean {
    return this.animationQueue.hasItems
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

  public async run() {
    console.log("[Event loop]: Started.")
    while (this.hasTasks) {
      if (this.hasMacroTask) {
        const { callback } = this.macroTaskQueue.shift()
        await callback()
      }
      while (this.hasMicroTask) {
        const { callback } = this.microTaskQueue.shift()
        await callback()
      }
      if (this.isPainting) {
        while (this.hasAnimationTask) {
          const { callback } = this.animationQueue.shift()
          await callback()
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

  for (let i = 1; i <= quantity; i++) {
    const ms = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay)
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)]

    switch (taskType) {
      case "macro":
        // Simulate a network request
        await loop.queueMacroTask(async () => {
          console.log(
            `[Event loop] -> Macro task started: making network request...`,
          )
          await new Promise((resolve) => setTimeout(resolve, ms))
          console.log(`[Event loop] -> Macro task completed after ${ms} ms.`)
        }, ms)
        break

      case "micro":
        // Simulate a computation
        await loop.queueMicroTask(() => {
          console.log(
            `[Event loop] -> Micro task started: performing computation...`,
          )
          let result = 0
          for (let j = 0; j < 1e3; j++) result += j
          console.log(
            `[Event loop] -> Micro task completed: result is ${result}.`,
          )
        }, ms)
        break

      case "animation":
        // Simulate a DOM manipulation
        await loop.queueAnimationTask(async () => {
          console.log(
            `[Event loop] -> Animation task started: manipulating DOM...`,
          )
          await new Promise((resolve) => setTimeout(resolve, ms))
          console.log(
            `[Event loop] -> Animation task completed after ${ms} ms.`,
          )
        }, ms)
        break
    }
  }
}

function onComplete() {
  console.log("[Event loop]: Call stack empty, finished.")
}

function onError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}

async function runOnce() {
  const loop = new EventLoop()
  await getTasks(loop, { minDelay: 500, maxDelay: 1000, quantity: 5 })
  await loop.run().then(onComplete).catch(onError)
}

await runOnce()
