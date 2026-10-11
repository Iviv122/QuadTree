// copied and modified from
// https://www.geeksforgeeks.org/javascript/javascript-program-for-implementation-of-queue-using-linked-list/
class ListNode<T> {
  data: T;
  next?: ListNode<T> = undefined;
  constructor(data: T) {
    this.data = data;
  }
}

export class Queue<T> {
  front?: ListNode<T>;
  end?: ListNode<T>;
  size: number = 0;

  enqueue(data: T) {
    const newNode = new ListNode(data);
    if (!this.front) {
      this.front = newNode;
    } else {
      //@ts-ignore
      this.end.next = newNode;
    }
    this.end = newNode;
    this.size++;
  }

  dequeue() {
    if (!this.front) return undefined;

    const removed = this.front;
    this.front = this.front.next;

    if (!this.front) {
      this.end = undefined;
    }

    this.size--;
    return removed.data;
  }

  peek() {
    return this.front ? this.front.data : undefined;
  }

  isEmpty() {
    return this.size === 0;
  }
}
