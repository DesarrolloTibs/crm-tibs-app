import React, { useEffect, useRef } from 'react';

const LoginBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const mouse = { x: 0, y: 0, radius: 150 };

        const colors = [
            'rgba(37, 99, 235, 0.4)',  // Blue
            'rgba(79, 70, 229, 0.4)',  // Indigo
            'rgba(249, 115, 22, 0.4)', // Orange
            'rgba(244, 63, 94, 0.4)'   // Rose
        ];

        class Particle {
            x: number;
            y: number;
            originX: number;
            originY: number;
            size: number;
            color: string;
            opacity: number;
            angle: number;
            velocity: number;
            swirl: number;
            type: 'dot' | 'stroke';

            constructor(x: number, y: number, size: number, color: string) {
                this.x = x;
                this.y = y;
                this.originX = canvas!.width / 2;
                this.originY = canvas!.height / 2;
                this.size = size;
                this.color = color;
                this.opacity = (Math.random() * 0.5) + 0.1;
                
                // Physics for "Liftoff" (Radial outward)
                const dx = this.x - this.originX;
                const dy = this.y - this.originY;
                this.angle = Math.atan2(dy, dx);
                this.velocity = (Math.random() * 0.5) + 0.2;
                this.swirl = (Math.random() - 0.5) * 0.01;
                this.type = Math.random() > 0.8 ? 'stroke' : 'dot';
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                
                ctx.beginPath();
                const alpha = this.opacity.toFixed(2);
                ctx.fillStyle = this.color.replace('0.4', alpha);
                
                if (this.type === 'dot') {
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                } else {
                    // "Stroke" shape typical in Antigravity
                    ctx.roundRect(-this.size, -this.size/2, this.size * 3, this.size, 2);
                }
                
                ctx.fill();
                ctx.restore();
            }

            update(time: number) {
                // Expanding Flow
                this.angle += this.swirl;
                this.x += Math.cos(this.angle) * this.velocity;
                this.y += Math.sin(this.angle) * this.velocity;

                // Subtle wavy oscillation
                this.x += Math.sin(time * 0.001) * 0.1;
                this.y += Math.cos(time * 0.001) * 0.1;

                // Boundary reset (Return to center cluster)
                const distFromCenter = Math.sqrt(Math.pow(this.x - this.originX, 2) + Math.pow(this.y - this.originY, 2));
                if (distFromCenter > Math.max(canvas!.width, canvas!.height)) {
                    this.x = this.originX + (Math.random() - 0.5) * 100;
                    this.y = this.originY + (Math.random() - 0.5) * 100;
                    const dx = this.x - this.originX;
                    const dy = this.y - this.originY;
                    this.angle = Math.atan2(dy, dx);
                }

                // Mouse influence (Push/Distort)
                const mdx = mouse.x - this.x;
                const mdy = mouse.y - this.y;
                const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                if (mdist < 150) {
                    const force = (150 - mdist) / 150;
                    this.x -= (mdx / mdist) * force * 2;
                    this.y -= (mdy / mdist) * force * 2;
                }

                this.draw();
            }
        }

        const init = () => {
            particles = [];
            const numberOfParticles = (canvas.width * canvas.height) / 1200;
            
            for (let i = 0; i < numberOfParticles; i++) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const size = (Math.random() * 2) + 0.5;
                
                // Color clustering by quadrant (Inspired by Antigravity)
                let color = colors[0]; // Default Blue
                if (x > canvas.width / 2 && y < canvas.height / 2) color = colors[1]; // Top-Right: Purple
                if (x < canvas.width / 2 && y > canvas.height / 2) color = colors[3]; // Bottom-Left: Rose
                if (x > canvas.width / 2 && y > canvas.height / 2) color = colors[2]; // Bottom-Right: Orange/Gold
                
                particles.push(new Particle(x, y, size, color));
            }
        };

        const animate = (time: number) => {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update(time);
            }
        };

        const handleResize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            } else {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            init();
        };

        const handleMouseMove = (event: MouseEvent) => {
            // Mouse relative to the canvas/parent
            const rect = canvas.getBoundingClientRect();
            mouse.x = event.clientX - rect.left;
            mouse.y = event.clientY - rect.top;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        
        handleResize();
        requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 block w-full h-full pointer-events-none"
        />
    );
};

export default LoginBackground;
