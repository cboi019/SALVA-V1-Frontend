document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    const toggleMenu = () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        hamburger.classList.toggle('active');
    };

    if (hamburger) hamburger.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', toggleMenu);

    // Smooth scroll for anchor links (e.g., jumping to developer-section)
    document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth' });
                // Close sidebar on mobile after clicking
                if (window.innerWidth <= 768) toggleMenu();
            }
        });
    });
});

// Copy Email to Clipboard Function
function copySupportEmail() {
    const email = document.getElementById('emailText').innerText;
    const status = document.getElementById('copyStatus');
    const icon = document.getElementById('copyIcon');

    navigator.clipboard.writeText(email).then(() => {
        status.classList.add('show');
        if(icon) icon.innerText = '✅';
        
        setTimeout(() => {
            status.classList.remove('show');
            if(icon) icon.innerText = '📋';
        }, 2000);
    }).catch(err => {
        console.error('Copy failed', err);
    });
}