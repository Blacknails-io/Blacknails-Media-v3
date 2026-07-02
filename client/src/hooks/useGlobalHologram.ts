import { useEffect } from 'react';

export const useGlobalHologram = () => {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position relative to the center of the window
      // Values will range from -1 to 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;

      // Inyectamos las variables CSS en la raíz del documento
      document.documentElement.style.setProperty('--holo-x', x.toFixed(3));
      document.documentElement.style.setProperty('--holo-y', y.toFixed(3));
    };

    // Attach event listener
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
};
