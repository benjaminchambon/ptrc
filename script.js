const header=document.querySelector('.site-header');
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
function syncHeader(){if(header&&!header.classList.contains('inner'))header.classList.toggle('scrolled',window.scrollY>28)}
syncHeader();window.addEventListener('scroll',syncHeader,{passive:true});
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false')}))}
document.querySelectorAll('.faq-question').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.faq-item').classList.toggle('open')));
document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());

// YouTube embeds cannot reliably load from file:// URLs (YouTube error 153).
// Keep the inline player on a real HTTP/HTTPS site, but show a clean fallback
// when someone previews the static HTML directly from their computer.
if (window.location.protocol === 'file:') {
  document.querySelectorAll('.video-frame iframe[src*="youtube.com/embed/"]').forEach((iframe) => {
    const match = iframe.src.match(/\/embed\/([^?&/]+)/);
    if (!match) return;
    const videoId = match[1];
    const title = iframe.getAttribute('title') || 'Vidéo Paris Tag Rugby Club';
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const fallback = document.createElement('a');
    fallback.className = 'youtube-local-fallback';
    fallback.href = watchUrl;
    fallback.target = '_blank';
    fallback.rel = 'noreferrer';
    fallback.setAttribute('aria-label', `${title} — ouvrir sur YouTube`);
    fallback.innerHTML = `
      <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" alt="${title}">
      <span class="youtube-local-overlay">
        <span class="youtube-play" aria-hidden="true">▶</span>
        <strong>Voir la vidéo</strong>
        <small>Lecture sur YouTube</small>
      </span>`;
    iframe.replaceWith(fallback);
  });
}
