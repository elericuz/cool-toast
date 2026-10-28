// Fragmentos de código estáticos de la sección de instalación (fuera de .svelte para que el
// escáner de dependencias de Vite no confunda el `<script>` del ejemplo con código real)
export const installCode = 'npm install @elericuz/cool-toast';

export const layoutCode = `<script lang="ts">
  import '@elericuz/cool-toast/styles.css';
  import { Toaster } from '@elericuz/cool-toast';

  let { children } = $props();
</script>

<Toaster />
{@render children()}`;

export const usageCode = `import { toast } from '@elericuz/cool-toast';

toast.success('Saved', { description: 'Your changes are live.' });`;
