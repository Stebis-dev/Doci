/** A base animal class used by test fixtures. */
export class Animal {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    speak(): string {
        return `${this.name} makes a sound.`;
    }
}

export enum AnimalKind {
    Mammal = 'mammal',
    Bird = 'bird',
    Reptile = 'reptile',
}
