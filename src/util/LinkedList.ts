export class Node<T> {
  public next: Node<T> | null = null
  public prev: Node<T> | null = null
  constructor(public data: T) {}
}

export class LinkedList<T> {
  #size: number = 0
  #head: Node<T> | null = null
  #tail: Node<T> | null = null

  get size(): number {
    return this.#size
  }
  get head(): Node<T> | null {
    return this.#head
  }
  get tail(): Node<T> | null {
    return this.#tail
  }

  isEmpty(): boolean {
    return this.#size === 0
  }

  insertHead(data: T): Node<T> {
    const node = new Node(data)
    if (!this.#head) {
      this.#head = node
      this.#tail = node
    } else {
      node.next = this.#head
      this.#head.prev = node
      this.#head = node
    }
    this.#size++
    return node
  }

  insertTail(data: T): Node<T> {
    const node = new Node(data)
    if (!this.#tail) {
      this.#tail = node
      this.#head = node
    } else {
      node.prev = this.#tail
      this.#tail.next = node
      this.#tail = node
    }
    this.#size++
    return node
  }

  purgeNode(node: Node<T>): Node<T> | null {
    if (node.prev) node.prev.next = node.next
    if (node.next) node.next.prev = node.prev

    node.prev = null
    node.next = null

    this.#size--
    return node
  }

  deleteHead(): Node<T> | null {
    if (!this.#head) return null

    const deletedNode = this.#head
    if (this.#head === this.#tail) {
      this.#head = null
      this.#tail = null
    } else {
      this.#head = this.#head.next
    }
    return this.purgeNode(deletedNode)
  }

  deleteTail(): Node<T> | null {
    if (!this.#tail) return null

    const deletedNode = this.#tail
    if (this.#tail === this.#head) {
      this.#tail = null
      this.#head = null
    } else {
      this.#tail = this.#tail.prev
    }
    return this.purgeNode(deletedNode)
  }

  count(predicate: (data: T) => boolean): number {
    let count = 0
    let node = this.#head

    while (node) {
      if (predicate(node.data)) count++
      node = node.next
    }
    return count
  }

  array(): T[] {
    let array = new Array<T>()
    let node = this.#head

    while (node) {
      array.push(node.data)
      node = node.next
    }
    return array
  }

  forEach(callback: (node: Node<T>, index: number) => void): void {
    let id = 0
    let node = this.#head

    while (node) {
      callback(node, id)
      node = node.next
      id++
    }
  }

  forEachReverse(callback: (node: Node<T>, index: number) => void): void {
    let id = this.#size - 1
    let node = this.#tail

    while (node) {
      callback(node, id)
      node = node.prev
      id--
    }
  }

  search(comparator: (data: T) => boolean): Node<T> | null {
    let node = this.#head

    while (node) {
      if (comparator(node.data)) return node
      node = node.next
    }
    return null
  }

  filter(predicate: (data: T) => boolean): LinkedList<T> {
    let newList = new LinkedList<T>()
    let node = this.#head

    while (node) {
      if (predicate(node.data)) newList.insertTail(node.data)
      node = node.next
    }
    return newList
  }
}
