import React, { useRef, useEffect } from 'react';

type Language = 'en' | 'ar';

const translations = {
  en: {
    dhikr: [
      "ALLAH AKBAR", 
      "ALHAMDULLILAH", 
      "SUBHANALLAH", 
      "ASTAGHFIRULLAH", 
      "LA ILAHA ILLALLAH",
      "SUBHANALLAHI WA BIHAMDIHI",
      "LA HAWLA WALA QUWWATA ILLA BILLAH",
      "ALLAHUMMA SALLI ALA MUHAMMAD",
      "SUBHANALLAHIL ADHEEM",
      "HASBUNALLAHU WA NI'MAL WAKEEL",
      "YA HAYYU YA QAYYUM",
      "RABBANA ATINA FID-DUNYA HASANAH",
      "SUBHANALLAHI WA BIHAMDIHI, SUBHANALLAHIL ADHEEM",
      "LA ILAHA ILLA ANTA SUBHANAKA INNI KUNTU MINADH-DHALIMEEN",
      "ALLAHUMMA INNI AS'ALUKA AL-JANNAH"
    ]
  },
  ar: {
    dhikr: [
      "الله اكبر", 
      "الحمدالله", 
      "سبحان الله", 
      "استغفر الله", 
      "لا إله إلا الله",
      "سبحان الله وبحمده",
      "لا حول ولا قوة إلا بالله",
      "اللهم صل على محمد",
      "سبحان الله العظيم",
      "حسبنا الله ونعم الوكيل",
      "يا حي يا قيوم",
      "ربنا آتنا في الدنيا حسنة",
      "سبحان الله وبحمده، سبحان الله العظيم",
      "لا إله إلا أنت سبحانك إني كنت من الظالمين",
      "اللهم إني أسألك الجنة"
    ]
  }
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

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      mouse.current.active = true;

      // Spawn particles - Slower and more subtle
      const dhikrList = translations[language].dhikr;
      if (Math.random() > 0.85) {
        particles.current.push({
          x: e.clientX,
          y: e.clientY,
          text: dhikrList[Math.floor(Math.random() * dhikrList.length)],
          opacity: 1,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5,
          life: 200,
          size: Math.random() * 4 + 12
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Subtle spotlight
      if (mouse.current.active) {
        const gradient = ctx.createRadialGradient(
          mouse.current.x, mouse.current.y, 0,
          mouse.current.x, mouse.current.y, 600
        );
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.05)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      particles.current = particles.current.filter(p => p.life > 0);
      
      particles.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        p.opacity = p.life / 200;
        
        ctx.font = `${p.size}px "Amiri", serif`;
        ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity * 0.4})`;
        ctx.fillText(p.text, p.x, p.y);
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

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
