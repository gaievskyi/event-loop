type AsyncCallback = () => Promise<void>
type SyncCallback = () => void
type Callback = SyncCallback | AsyncCallback

interface Heap<T> {
  get size(): number
  get hasItems(): boolean
  push(item: T): void
  shift(): T
  peek(): T
}

class BinaryHeap<T extends Task> implements Heap<T> {
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
    while (this.parentOf(i) >= 0 && this.items[this.parentOf(i)].ms > this.items[i].ms) {
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

class Task {
  constructor(
    public readonly callback: Callback,
    public readonly ms: number,
  ) {}
}

function repaint(): void {
  console.log("[Render engine]: Rendering page changes...")
}

async function execute(queue: BinaryHeap<Task>): ReturnType<AsyncCallback> {
  const { callback } = queue.shift()
  return await callback()
}

class EventLoop {
  private readonly macroTaskQueue = new BinaryHeap<Task>(16)
  private readonly microTaskQueue = new BinaryHeap<Task>(16)
  private readonly animationQueue = new BinaryHeap<Task>(16)
  private lastPaintTime: number = Date.now()

  get isPainting(): boolean {
    // 60 times a second (every 16 ms)
    return Date.now() - this.lastPaintTime >= 16
  }

  get hasTasks(): boolean {
    return [this.macroTaskQueue, this.microTaskQueue, this.animationQueue].some(
      (queue) => queue.hasItems,
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

  public async queueMacroTask(callback: Callback, ms: number) {
    const task = new Task(callback, ms)
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.macroTaskQueue.push(task)
        resolve()
      }, ms)
    })
  }

  public async queueMicroTask(callback: Callback, ms: number) {
    const task = new Task(callback, ms)
    return Promise.resolve().then(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            this.microTaskQueue.push(task)
            resolve()
          }, ms)
        }),
    )
  }

  public async queueAnimationTask(callback: Callback, ms: number) {
    const task = new Task(callback, ms)
    return new Promise<void>((resolve) => {
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
        await execute(this.macroTaskQueue)
      }
      while (this.hasMicroTask) {
        await execute(this.microTaskQueue)
      }
      if (this.isPainting) {
        while (this.hasAnimationTask) {
          await execute(this.animationQueue)
        }
        this.lastPaintTime = Date.now()
        repaint()
      }
    }
  }
}

enum Tasks {
  MacroTask = "mockMacroTask",
  MicroTask = "mockMicroTask",
  AnimationTask = "mockAnimationTask",
}

function withLogging<Args extends unknown[], Return>(target: (...args: Args) => Promise<Return>) {
  return async function (...args: Args): Promise<Return> {
    console.log(`[Event loop] -> Task started...`)
    const result = await target(...args)
    console.log(`[Event loop] -> Task completed.`)
    return result
  }
}

class TaskMocker {
  constructor(private loop: EventLoop) {}

  public async [Tasks.MacroTask](ms: number) {
    await this.loop.queueMacroTask(
      withLogging(async () => {
        await new Promise((resolve) => setTimeout(resolve, ms))
      }),
      ms,
    )
  }

  public async [Tasks.MicroTask](ms: number) {
    await this.loop.queueMicroTask(
      withLogging(async () => {
        let result = 0
        for (let j = 0; j < 1e3; j++) result += j
        await Promise.resolve()
      }),
      ms,
    )
  }

  public async [Tasks.AnimationTask](ms: number) {
    await this.loop.queueAnimationTask(
      withLogging(async () => {
        await new Promise((resolve) => setTimeout(resolve, ms))
      }),
      ms,
    )
  }
}

type Options = { minDelay: number; maxDelay: number; quantity: number }

async function mockTasks(loop: EventLoop, options: Options) {
  const { minDelay, maxDelay, quantity } = options

  if (minDelay > maxDelay) {
    throw new Error("Invalid options: minDelay, maxDelay")
  }

  const taskMocker = new TaskMocker(loop)

  for (let i = 1; i <= quantity; i++) {
    const ms = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay)
    const taskTypes = Object.values(Tasks)
    const randomI = Math.floor(Math.random() * taskTypes.length)
    const taskType = taskTypes[randomI]

    await taskMocker[taskType](ms)
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

async function run() {
  try {
    const loop = new EventLoop()
    await mockTasks(loop, { minDelay: 100, maxDelay: 800, quantity: 6 })
    await loop.run()
  } catch (error) {
    onError(error)
  } finally {
    onComplete()
  }
}

await run()
