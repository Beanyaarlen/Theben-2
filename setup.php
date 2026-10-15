<?php
require __DIR__.'/bootstrap.php';header('X-Robots-Tag: noindex, nofollow');startSession();
$pdo=db();
try{$installed=(int)$pdo->query('SELECT COUNT(*) FROM cms_users')->fetchColumn()>0;}catch(Throwable $e){exit('Impor schema.sql melalui phpMyAdmin terlebih dahulu.');}
if($installed){http_response_code(403);exit('Setup sudah selesai. Hapus setup.php dan buka admin.php.');}
$error='';
if($_SERVER['REQUEST_METHOD']==='POST'){
 csrf();$c=require __DIR__.'/private/config.php';
 $token=(string)($c['setup_token']??'');
 if(strlen($token)<32 || str_starts_with($token,'GANTI_') || !hash_equals($token,(string)($_POST['token']??'')))$error='Token setup tidak valid.';
 elseif(!preg_match('/^[a-zA-Z0-9_.-]{3,100}$/',$_POST['username']??'') || strlen($_POST['password']??'')<12)$error='Username 3–100 karakter; password minimal 12 karakter.';
 else{
  try{
   $lock=$pdo->query("SELECT GET_LOCK('theben_cms_setup',10)")->fetchColumn();
   if((int)$lock!==1)throw new RuntimeException('Setup busy');
   $pdo->beginTransaction();
   if((int)$pdo->query('SELECT COUNT(*) FROM cms_users')->fetchColumn()>0)throw new RuntimeException('Installed');
   $seed=json_decode(file_get_contents(__DIR__.'/private/seed.json'),true,512,JSON_THROW_ON_ERROR);
   $q=$pdo->prepare('INSERT INTO cms_pages(route,title) VALUES(?,?)');foreach($seed['pages'] as $r=>$t)$q->execute([$r,$t]);
   $q=$pdo->prepare('INSERT INTO cms_content(page,field_key,prop,label,value) VALUES(?,?,?,?,?)');foreach($seed['fields'] as $f)$q->execute([$f['page'],$f['key'],$f['prop'],$f['label'],$f['value']]);
   $pdo->prepare('INSERT INTO cms_users(username,password_hash) VALUES(?,?)')->execute([$_POST['username'],password_hash($_POST['password'],PASSWORD_DEFAULT)]);
   $pdo->commit();$pdo->query("SELECT RELEASE_LOCK('theben_cms_setup')");
   header('Location: admin.php');exit;
  }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();$error='Setup gagal. Periksa tabel kosong dan konfigurasi; jangan impor konten dua kali.';}
 }
}
?><!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Setup Theben</title><link rel="stylesheet" href="admin.css"><main class="login"><h1>Setup dashboard Theben</h1><p>Impor SQL dan isi konfigurasi sebelum membuat akun.</p><p class="error"><?=esc($error)?></p><form method="post"><input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>"><label>Token setup<input name="token" type="password" required></label><label>Username admin<input name="username" required autocomplete="username"></label><label>Password admin (minimal 12 karakter)<input name="password" type="password" minlength="12" required autocomplete="new-password"></label><button>Buat akun dan impor konten</button></form></main></html>
