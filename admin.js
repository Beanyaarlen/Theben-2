const search=document.querySelector('#field-search');
search?.addEventListener('input',()=>document.querySelectorAll('.field').forEach(el=>el.hidden=!el.dataset.search.toLocaleLowerCase('id').includes(search.value.toLocaleLowerCase('id'))));
let dirty=false;document.querySelector('#editor')?.addEventListener('input',()=>{dirty=true;document.querySelector('#edit-status').textContent='Ada perubahan yang belum disimpan.'});
document.querySelector('#editor')?.addEventListener('submit',()=>dirty=false);
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
