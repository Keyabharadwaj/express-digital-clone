document.addEventListener("DOMContentLoaded", () => {
    // -------------------------------------------------------------
    // 1. Scroll-Triggered Reveal Animations
    // -------------------------------------------------------------
    const revealElements = document.querySelectorAll(
        ".service-card, .work-card, .stat-card, .process-step, .contact-info-card, .contact-form-wrapper, .section-header, .inner-hero"
    );

    revealElements.forEach((el) => el.classList.add("reveal-on-scroll"));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("revealed");
                // Optionally stop observing once revealed
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach((el) => revealObserver.observe(el));

    // -------------------------------------------------------------
    // 2. Interactive 3D Card Tilt Effect
    // -------------------------------------------------------------
    const tiltCards = document.querySelectorAll(".service-card, .work-card, .stat-card");

    tiltCards.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -8; // Max 8 deg tilt
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
        });
    });

    // -------------------------------------------------------------
    // 3. Three.js Interactive Hero Background
    // -------------------------------------------------------------
    const container = document.getElementById("hero-canvas");
    if (container && typeof THREE !== "undefined") {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 15;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        const geometry = new THREE.IcosahedronGeometry(10, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x2563eb,
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        let mouseX = 0, mouseY = 0;
        window.addEventListener("mousemove", (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
        });

        function animate() {
            requestAnimationFrame(animate);
            sphere.rotation.x += 0.002;
            sphere.rotation.y += 0.003;
            sphere.rotation.x += (mouseY - sphere.rotation.x) * 0.05;
            sphere.rotation.y += (mouseX - sphere.rotation.y) * 0.05;
            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener("resize", () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    // -------------------------------------------------------------
    // 4. Animated Counter Numbers
    // -------------------------------------------------------------
    const counters = document.querySelectorAll(".counter");
    if (counters.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = +counter.getAttribute("data-target");
                    let count = 0;
                    const speed = target / 40;

                    const updateCount = () => {
                        count += speed;
                        if (count < target) {
                            counter.innerText = Math.ceil(count);
                            setTimeout(updateCount, 25);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    updateCount();
                    counterObserver.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach((counter) => counterObserver.observe(counter));
    }

    // -------------------------------------------------------------
    // 5. AJAX Contact Form Handler
    // -------------------------------------------------------------
    const contactForm = document.getElementById("ajax-contact-form");
    const formResponse = document.getElementById("form-response");

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector("button[type='submit']");
            const originalText = submitBtn.innerText;

            submitBtn.innerText = "Sending...";
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const payload = Object.fromEntries(formData.entries());

            try {
                const response = await fetch("/contact", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok) {
                    formResponse.className = "form-response success";
                    formResponse.innerText = result.message || "Message sent successfully!";
                    contactForm.reset();
                } else {
                    formResponse.className = "form-response error";
                    formResponse.innerText = result.message || "Failed to submit.";
                }
            } catch (err) {
                formResponse.className = "form-response error";
                formResponse.innerText = "Network error. Please try again.";
            } finally {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});