import React, { useRef, useEffect } from 'react';

type Language = 'en' | 'ar';

const translations = {
  en: {
    dhikr: [
      'ALLAH AKBAR',
      'ALHAMDULILLAH',
      'SUBHANALLAH',
      'ASTAGHFIRULLAH',
      'LA ILAHA ILLALLAH',
      'SUBHANALLAHI WA BIHAMDIHI',
      'LA HAWLA WALA QUWWATA ILLA BILLAH',
      'ALLAHUMMA SALLI ALA MUHAMMAD',
      'SUBHANALLAHIL ADHEEM',
      "HASBUNALLAHU WA NI'MAL WAKEEL",
      'YA HAYYU YA QAYYUM',
      'RABBANA ATINA FID-DUNYA HASANAH',
    ],
  },
  ar: {
    dhikr: [
      'الله أكبر',
      'الحمد لله',
      'سبحان الله',
      'أستغفر الله',
      'لا إله إلا الله',
      'سبحان الله وبحمده',
      'لا حول ولا قوة إلا بالله',
      'اللهم صل على محمد',
      'سبحان الله العظيم',
      'حسبنا الله ونعم الوكيل',
      'يا حي يا قيوم',
      'ربنا آتنا في الدنيا حسنة',
    ],
  },
};

export const MouseParticles = ({ language }: { language: Language }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const mouse = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
      mouse.current.active = true;

      const dhikrList = translations[language].dhikr;
      if (Math.random() > 0.88) {
        particles.current.push({
          x: event.clientX,
          y: event.clientY,
          text: dhikrList[Math.floor(Math.random() * dhikrList.length)],
          opacity: 1,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 - 0.4,
          life: 180,
          size: Math.random() * 4 + 12,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (mouse.current.active) {
        const gradient = ctx.createRadialGradient(
          mouse.current.x,
          mouse.current.y,
          0,
          mouse.current.x,
          mouse.current.y,
          520
        );
        gradient.addColorStop(0, 'rgba(22, 212, 159, 0.04)');
        gradient.addColorStop(1, 'rgba(22, 212, 159, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      particles.current = particles.current.filter((particle) => particle.life > 0);

      particles.current.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;
        particle.opacity = particle.life / 180;

        ctx.font = `${particle.size}px "Amiri", serif`;
        ctx.fillStyle = `rgba(22, 212, 159, ${particle.opacity * 0.35})`;
        ctx.fillText(particle.text, particle.x, particle.y);
      });

      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [language]);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />;
};
