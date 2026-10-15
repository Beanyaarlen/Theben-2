<?php
require __DIR__.'/bootstrap.php';header('X-Robots-Tag: noindex, nofollow');startSession();$pdo=db();$error='';$notice='';
if($_SERVER['REQUEST_METHOD']==='POST'){
 csrf();$action=$_POST['action']??'';
 if($action==='login'){
  $ip=hash('sha256',$_SERVER['REMOTE_ADDR']??'');$q=$pdo->prepare('SELECT * FROM cms_login_attempts WHERE ip_hash=?');$q->execute([$ip]);$a=$q->fetch();
  if($a && $a['attempts']>=10 && time()-(int)$a['last_attempt']<900)$error='Terlalu banyak percobaan. Tunggu 15 menit.';
  else{
   $q=$pdo->prepare('SELECT * FROM cms_users WHERE username=?');$q->execute([$_POST['username']??'']);$u=$q->fetch();
   if($u && password_verify($_POST['password']??'',$u['password_hash'])){session_regenerate_id(true);$_SESSION['user']=$u['id'];$_SESSION['last']=time();$pdo->prepare('DELETE FROM cms_login_attempts WHERE ip_hash=?')->execute([$ip]);header('Location: admin.php');exit;}
   $count=($a && time()-(int)$a['last_attempt']<900)?(int)$a['attempts']+1:1;
   $pdo->prepare('INSERT INTO cms_login_attempts(ip_hash,attempts,last_attempt) VALUES(?,?,?) ON DUPLICATE KEY UPDATE attempts=?,last_attempt=?')->execute([$ip,$count,time(),$count,time()]);$error='Username atau password salah.';
  }
 }
}
if(isset($_SESSION['user']) && time()-($_SESSION['last']??0)>3600)unset($_SESSION['user']);
if(!isset($_SESSION['user'])){
?><!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Login admin Theben</title><link rel="stylesheet" href="admin.css"><main class="login"><span class="eyebrow">THEBEN · CONTENT MANAGER</span><h1>Kelola website kamu.</h1><p>Masuk untuk mengubah teks, gambar, dan tautan.</p><p class="error"><?=esc($error)?></p><form method="post"><input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>"><input type="hidden" name="action" value="login"><label>Username<input name="username" autocomplete="username" required></label><label>Password<input type="password" name="password" autocomplete="current-password" required></label><button>Masuk dashboard ↗</button></form></main></html><?php exit; }
$_SESSION['last']=time();
if($_SERVER['REQUEST_METHOD']==='POST' && ($_POST['action']??'')==='logout'){$_SESSION=[];session_destroy();header('Location: admin.php');exit;}
$pages=$pdo->query('SELECT * FROM cms_pages ORDER BY route')->fetchAll();$route=$_GET['page']??'index.html';
if(!in_array($route,array_column($pages,'route'),true)){http_response_code(404);exit('Halaman tidak tersedia.');}
$q=$pdo->prepare('SELECT * FROM cms_content WHERE page=? ORDER BY CAST(SUBSTRING(field_key,2) AS UNSIGNED),prop');$q->execute([$route]);$fields=$q->fetchAll();
if($_SERVER['REQUEST_METHOD']==='POST' && ($_POST['action']??'')==='save'){
 try{
  $pdo->beginTransaction();$update=$pdo->prepare('UPDATE cms_content SET value=? WHERE page=? AND field_key=? AND prop=?');
  foreach($fields as $i=>$f){if(!array_key_exists((string)$i,$_POST['values']??[]))continue;$v=(string)$_POST['values'][$i];if(!fieldValid($f['prop'],$v))throw new RuntimeException('Alamat tautan/gambar atau panjang konten tidak valid.');$update->execute([$v,$route,$f['field_key'],$f['prop']]);}
  $pdo->commit();header('Location: admin.php?page='.urlencode($route).'&saved=1');exit;
 }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();$error='Perubahan tidak disimpan. Periksa alamat tautan/gambar dan ukuran konten.';}
}
if($_SERVER['REQUEST_METHOD']==='POST' && ($_POST['action']??'')==='upload'){
 $f=$_FILES['image']??null;
 if(!$f || $f['error']!==UPLOAD_ERR_OK || $f['size']>5*1024*1024)$error='Pilih gambar JPG, PNG, atau WebP maksimal 5 MB.';
 else{
  $mime=(new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);$ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime]??null;
  $info=@getimagesize($f['tmp_name']);
  if(!$ext || !$info || $info[0]*$info[1]>40000000)$error='Format atau dimensi gambar tidak didukung.';
  else{$name=bin2hex(random_bytes(16)).'.'.$ext;if(move_uploaded_file($f['tmp_name'],__DIR__.'/uploads/'.$name))$notice='Gambar berhasil diunggah. Salin alamat ini ke kolom src/data-image: '.(basepath()?:'').'/uploads/'.$name;else $error='Upload gagal. Periksa izin folder uploads.';}
 }
}
?><!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Dashboard Theben</title><link rel="stylesheet" href="admin.css"><script src="admin.js" defer></script></head><body><header class="top"><strong>theben<span> / dashboard</span></strong><div><a href="index.html" target="_blank" rel="noopener">Lihat website ↗</a><form method="post"><input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>"><button name="action" value="logout">Keluar</button></form></div></header><div class="layout"><aside><p class="eyebrow">HALAMAN WEBSITE</p><?php foreach($pages as $p):?><a class="<?= $p['route']===$route?'active':'' ?>" href="?page=<?=urlencode($p['route'])?>"><?=esc($p['title'])?></a><?php endforeach;?></aside><main><span class="eyebrow"><?=esc($route)?></span><h1>Edit konten halaman</h1><p>Ubah isi teks dan alamat gambar. Struktur serta animasi tetap mengikuti desain website.</p><?php if(isset($_GET['saved'])):?><p class="success">Perubahan sudah dipublikasikan. Muat ulang halaman website untuk melihat hasilnya.</p><?php endif;?><p class="error"><?=esc($error)?></p><?php if($notice):?><p class="success"><?=esc($notice)?></p><?php endif;?><details class="card"><summary>Upload gambar baru</summary><form method="post" enctype="multipart/form-data"><input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>"><input type="hidden" name="action" value="upload"><label>Gambar maksimal 5 MB<input type="file" name="image" accept="image/jpeg,image/png,image/webp" required></label><button>Upload gambar</button></form><p>Gambar baru belum mengganti gambar halaman sampai alamatnya disimpan di editor.</p></details><div class="toolbar"><label>Cari konten<input id="field-search" placeholder="Cari judul, paragraf, src, href…"></label><?php if(str_ends_with($route,'.html')):?><a class="preview" href="<?=esc($route)?>" target="_blank" rel="noopener">Buka halaman ↗</a><?php endif;?></div><form method="post" id="editor"><input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>"><input type="hidden" name="action" value="save"><?php foreach($fields as $i=>$f):?><div class="field card" data-search="<?=esc($f['label'].' '.$f['value'])?>"><label><span class="field-meta"><?=esc($f['field_key'].' · '.$f['label'])?></span><?php if(in_array($f['prop'],['src','data-image'])): ?><input name="values[<?=$i?>]" value="<?=esc($f['value'])?>"><small>Gunakan alamat hasil upload atau lokasi gambar yang sudah tersedia.</small><?php elseif(in_array($f['prop'],['href','alt','data-alt','aria-label','title','content'])):?><input name="values[<?=$i?>]" value="<?=esc($f['value'])?>"><?php else:?><textarea name="values[<?=$i?>]" rows="<?=strlen($f['value'])>180?4:2?>"><?=esc($f['value'])?></textarea><?php endif;?></label></div><?php endforeach;?><footer class="save"><span id="edit-status">Perubahan akan langsung tampil setelah disimpan.</span><button>Simpan & publikasikan ↗</button></footer></form></main></div></body></html>
