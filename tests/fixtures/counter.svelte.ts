// Fixture con runas: comprueba que los módulos `.svelte.ts` se compilan bajo vitest.
export class Counter {
	value = $state(0);
	double = $derived(this.value * 2);

	increment(): void {
		this.value += 1;
	}
}
