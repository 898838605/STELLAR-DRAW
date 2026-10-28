/* =========================================================
   STELLAR DRAW · ambient effects
   ========================================================= */
(function (NS) {
  "use strict";

  class Starfield {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.stars = [];
      this.shootingStars = [];
      this.dpr = 1;
      this.width = 0;
      this.height = 0;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.lastTime = 0;
      this.nextShootingStar = this.reducedMotion ? Infinity : performance.now() + 5200;
      this.frame = this.frame.bind(this);
      this.resize = this.resize.bind(this);
      this.resize();
      window.addEventListener("resize", this.resize, { passive: true });
      if (this.reducedMotion) {
        this.renderStatic();
      } else {
        requestAnimationFrame(this.frame);
      }
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = this.width + "px";
      this.canvas.style.height = this.height + "px";
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      const count = Math.max(80, Math.min(220, Math.round((this.width * this.height) / 9600)));
      this.stars = Array.from({ length: count }, () => this.createStar());
      if (this.reducedMotion) this.renderStatic();
    }

    createStar() {
      const depth = Math.random();
      return {
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        depth: depth,
        radius: (0.35 + Math.random() * (depth > 0.8 ? 1.5 : 0.8)) * 0.85,
        baseAlpha: 0.16 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.35 + Math.random() * 0.9,
        drift: 0.012 + depth * 0.042,
        warm: Math.random() > 0.86,
        accent: Math.random() > 0.92,
        cross: Math.random() > 0.965
      };
    }

    colorFor(star, alpha) {
      if (star.accent) return "rgba(215, 255, 122, " + alpha.toFixed(3) + ")";
      if (star.warm) return "rgba(247, 236, 210, " + alpha.toFixed(3) + ")";
      return "rgba(224, 235, 225, " + alpha.toFixed(3) + ")";
    }

    drawStar(context, star, time) {
      const twinkle = this.reducedMotion
        ? 1
        : 0.64 + Math.sin(time * 0.001 * star.twinkle + star.phase) * 0.36;
      const alpha = Math.max(0.03, star.baseAlpha * twinkle);
      context.fillStyle = this.colorFor(star, alpha);
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();

      if (star.cross && alpha > 0.24) {
        const length = 2.5 + star.depth * 4;
        context.strokeStyle = this.colorFor(star, alpha * 0.52);
        context.lineWidth = 0.55;
        context.beginPath();
        context.moveTo(star.x - length, star.y);
        context.lineTo(star.x + length, star.y);
        context.moveTo(star.x, star.y - length);
        context.lineTo(star.x, star.y + length);
        context.stroke();
      }
    }

    drawShootingStar(star) {
      const alpha = Math.max(0, 1 - star.progress / star.life);
      const tailX = star.x - star.vx * 0.07;
      const tailY = star.y - star.vy * 0.07;
      const gradient = this.ctx.createLinearGradient(star.x, star.y, tailX, tailY);
      gradient.addColorStop(0, "rgba(240, 247, 232, " + (alpha * 0.75).toFixed(2) + ")");
      gradient.addColorStop(1, "rgba(240, 247, 232, 0)");
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = 1.1;
      this.ctx.beginPath();
      this.ctx.moveTo(star.x, star.y);
      this.ctx.lineTo(tailX, tailY);
      this.ctx.stroke();
      this.ctx.fillStyle = "rgba(247, 252, 234, " + alpha.toFixed(2) + ")";
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, 1.4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    renderStatic() {
      const context = this.ctx;
      if (!context) return;
      context.clearRect(0, 0, this.width, this.height);
      this.stars.forEach((star) => this.drawStar(context, star, 0));
    }

    frame(time) {
      if (!this.lastTime) this.lastTime = time;
      const delta = Math.min(34, time - this.lastTime);
      this.lastTime = time;
      const isDrawing = document.body.classList.contains("is-drawing");
      const context = this.ctx;
      context.clearRect(0, 0, this.width, this.height);

      this.stars.forEach((star) => {
        star.y += star.drift * (isDrawing ? 2.6 : 1) * (delta / 16.67);
        if (star.y > this.height + 4) {
          star.y = -4;
          star.x = Math.random() * this.width;
        }
        this.drawStar(context, star, time);
      });

      if (isDrawing && this.stars.length) {
        context.strokeStyle = "rgba(215, 255, 122, 0.08)";
        context.lineWidth = 0.5;
        const sample = this.stars.slice(0, 26);
        for (let index = 0; index < sample.length - 1; index += 2) {
          const first = sample[index];
          const second = sample[index + 1];
          const distance = Math.hypot(second.x - first.x, second.y - first.y);
          if (distance < 210) {
            context.beginPath();
            context.moveTo(first.x, first.y);
            context.lineTo(second.x, second.y);
            context.stroke();
          }
        }
      }

      if (!isDrawing && time > this.nextShootingStar) {
        const fromLeft = Math.random() > 0.45;
        this.shootingStars.push({
          x: fromLeft ? -40 : Math.random() * this.width * 0.75,
          y: Math.random() * this.height * 0.46,
          vx: 230 + Math.random() * 150,
          vy: 75 + Math.random() * 60,
          life: 1.25 + Math.random() * 0.8,
          progress: 0
        });
        this.nextShootingStar = time + 7500 + Math.random() * 8000;
      }

      this.shootingStars = this.shootingStars.filter((star) => {
        star.progress += delta / 1000;
        if (star.progress >= star.life) return false;
        star.x += star.vx * (delta / 1000);
        star.y += star.vy * (delta / 1000);
        this.drawShootingStar(star);
        return true;
      });

      requestAnimationFrame(this.frame);
    }
  }

  const CONFETTI_SHAPES = ["ribbon", "disc", "spark", "square"];

  class Confetti {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.particles = [];
      this.dpr = 1;
      this.width = 0;
      this.height = 0;
      this.running = false;
      this.lastTime = 0;
      this.frame = this.frame.bind(this);
      this.resize();
      window.addEventListener("resize", () => this.resize(), { passive: true });
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = this.width + "px";
      this.canvas.style.height = this.height + "px";
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    burst(x, y, colors, count) {
      const total = count || 160;
      const palette = colors && colors.length ? colors : ["#d7ff7a", "#eff2e8", "#7ef0c8", "#efd49b"];
      for (let index = 0; index < total; index += 1) {
        const angle = -Math.PI * 0.95 + Math.random() * Math.PI * 1.9;
        const speed = 220 + Math.random() * 640;
        const isSpark = Math.random() > 0.82;
        const life = 2.1 + Math.random() * 2.3;
        this.particles.push({
          x: x + (Math.random() - 0.5) * 50,
          y: y + (Math.random() - 0.5) * 30,
          vx: Math.cos(angle) * speed * (0.65 + Math.random() * 0.7),
          vy: Math.sin(angle) * speed * (0.55 + Math.random() * 0.7) - 160,
          gravity: 520 + Math.random() * 300,
          drag: 0.975 + Math.random() * 0.018,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 12,
          size: (isSpark ? 1.8 : 3.5) + Math.random() * (isSpark ? 2.2 : 6.5),
          color: palette[Math.floor(Math.random() * palette.length)],
          shape: isSpark ? "spark" : CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
          life: life,
          age: 0,
          wobble: Math.random() * Math.PI * 2
        });
      }
      this.start();
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.lastTime = 0;
      requestAnimationFrame(this.frame);
    }

    drawParticle(particle, alpha) {
      const context = this.ctx;
      context.save();
      context.globalAlpha = alpha;
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;

      if (particle.shape === "ribbon") {
        context.fillRect(-particle.size * 0.5, -particle.size * 0.17, particle.size * 1.5, particle.size * 0.36);
      } else if (particle.shape === "disc") {
        context.beginPath();
        context.arc(0, 0, particle.size * 0.42, 0, Math.PI * 2);
        context.fill();
      } else if (particle.shape === "spark") {
        context.globalCompositeOperation = "lighter";
        context.fillRect(-particle.size * 1.5, -0.55, particle.size * 3, 1.1);
        context.fillRect(-0.55, -particle.size * 1.5, 1.1, particle.size * 3);
      } else {
        context.fillRect(-particle.size * 0.5, -particle.size * 0.5, particle.size, particle.size * 0.66);
      }
      context.restore();
    }

    frame(time) {
      if (!this.lastTime) this.lastTime = time;
      const delta = Math.min(0.033, (time - this.lastTime) / 1000);
      this.lastTime = time;
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.particles = this.particles.filter((particle) => {
        particle.age += delta;
        if (particle.age >= particle.life) return false;
        particle.vy += particle.gravity * delta;
        particle.vx *= Math.pow(particle.drag, delta * 60);
        particle.vy *= Math.pow(0.994, delta * 60);
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.spin * delta;
        particle.wobble += delta * 4;
        particle.x += Math.sin(particle.wobble) * 0.35;

        if (particle.y > this.height + 80 && particle.vy > 0) return false;
        const progress = particle.age / particle.life;
        const alpha = progress < 0.7 ? 1 : Math.max(0, 1 - (progress - 0.7) / 0.3);
        this.drawParticle(particle, alpha);
        return true;
      });

      if (this.particles.length) {
        requestAnimationFrame(this.frame);
      } else {
        this.running = false;
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
    }
  }

  NS.Starfield = Starfield;
  NS.Confetti = Confetti;
})(window.StellarDraw = window.StellarDraw || {});
