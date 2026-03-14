import { Animal } from './Animal';

/** A dog — extends Animal to exercise cross-file inheritance. */
export class Dog extends Animal {
    breed: string;

    constructor(name: string, breed: string) {
        super(name);
        this.breed = breed;
    }

    speak(): string {
        return `${this.name} barks.`;
    }
}
