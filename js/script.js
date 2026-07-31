// Dark mode toggle, shared by every page via the #darkModeToggle button
const toggle = document.getElementById('darkModeToggle');
const body = document.body;

if (localStorage.getItem('dark-mode') === 'true') {
  body.classList.add('dark-mode');
}

toggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  localStorage.setItem('dark-mode', body.classList.contains('dark-mode'));
});
