# Event Loop Simulator

This project provides a simple simulation of the JavaScript event loop. It includes the handling of macro tasks, micro tasks, and animation frame tasks. The event loop gives priority to different types of tasks and handles them accordingly.

## Installation

This project is written in TypeScript. We force using pnpm package manager for the best DX. Using **npm**, you can install it globally.

```bash
npm install -g pnpm
```

Then, clone the repository and install the dependencies:

```bash
git clone https://github.com/gaievskyi/event-loop.git
cd event-loop
pnpm install
```

## Usage

You can run the simulation by executing the npm script:

```bash
pnpm start
```

## API

### BinaryHeap

A binary heap data structure used for managing tasks in the event loop.

#### Methods

- `push(item: Task)`: Adds a task to the heap.
- `shift()`: Removes and returns the task with the highest priority (the task with the smallest `ms` value).
- `peek()`: Returns the task with the highest priority without removing it from the heap.

#### Properties

- `size`: The number of tasks in the heap.
- `hasItems`: A boolean indicating whether the heap has any tasks.

### Task

A class representing a task in the event loop.

#### Properties

- `callback`: The function to be executed when the task is run.
- `ms`: The delay before the task is added to the queue.

### EventLoop

A class representing the JavaScript event loop.

#### Methods

- `queueMacroTask(callback: Callback, ms: number)`: Adds a macro task to the queue.
- `queueMicroTask(callback: Callback, ms: number)`: Adds a micro task to the queue.
- `queueAnimationTask(callback: Callback, ms: number)`: Adds an animation task to the queue.
- `run()`: Starts the event loop.

#### Properties

- `isPainting`: A boolean indicating whether it's time to repaint the page.
- `hasTasks`: A boolean indicating whether there are any tasks in the queues.
- `hasMacroTask`: A boolean indicating whether there are any macro tasks in the queue.
- `hasMicroTask`: A boolean indicating whether there are any micro tasks in the queue.
- `hasAnimationTask`: A boolean indicating whether there are any animation tasks in the queue.

## Example

The `runOnce` function in the code provides an example of how to use the `EventLoop` class. It creates an instance of `EventLoop`, adds some tasks to the queues, and then starts the event loop. The tasks simulate network requests (macro tasks), computations (micro tasks), and DOM manipulations (animation tasks).

## License

This project is licensed under the MIT License.
