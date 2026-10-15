<?php
require __DIR__.'/bootstrap.php';
$path=rawurldecode(parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH)??'');
$base=basepath();
$route=ltrim(substr($path,strlen($base)),'/');if($route==='')$route='index.html';
$q=db()->prepare('SELECT route FROM cms_pages WHERE route=?');$q->execute([$route]);
if(!$q->fetch() || !is_file(__DIR__.'/private/templates/'.$route)){http_response_code(404);exit('Halaman tidak ditemukan.');}
$q=db()->prepare('SELECT field_key,prop,value FROM cms_content WHERE page=?');$q->execute([$route]);
$doc=new DOMDocument();libxml_use_internal_errors(true);
$doc->loadHTML('<?xml encoding="UTF-8">'.file_get_contents(__DIR__.'/private/templates/'.$route),LIBXML_NONET);libxml_clear_errors();
$xp=new DOMXPath($doc);
foreach($q as $f){
 $el=$xp->query('//*[@data-cms="'.$f['field_key'].'"]')->item(0);if(!$el)continue;
 if($f['prop']==='text'){
  foreach($el->childNodes as $node){if($node->nodeType===XML_TEXT_NODE){$node->nodeValue=$f['value'];break;}}
 }elseif(str_starts_with($f['prop'],'tail:')){
  $children=[];foreach($el->childNodes as $node)if($node->nodeType===XML_ELEMENT_NODE)$children[]=$node;
  $child=$children[(int)substr($f['prop'],5)]??null;
  if($child && $child->nextSibling && $child->nextSibling->nodeType===XML_TEXT_NODE)$child->nextSibling->nodeValue=$f['value'];
 }else $el->setAttribute($f['prop'],$f['value']);
}
$dataScript=$doc->createElement('script');$dataScript->setAttribute('src',($base?:'').'/content-data.php');$doc->getElementsByTagName('head')->item(0)->insertBefore($dataScript,$doc->getElementsByTagName('head')->item(0)->firstChild);
foreach(['link','script'] as $tag){$el=$doc->createElement($tag);$el->setAttribute($tag==='link'?'href':'src',($base?:'').'/cms-motion.'.($tag==='link'?'css':'js'));if($tag==='link')$el->setAttribute('rel','stylesheet');else $el->setAttribute('defer','');$doc->getElementsByTagName($tag==='link'?'head':'body')->item(0)->appendChild($el);}
header('Content-Type: text/html; charset=utf-8');
echo preg_replace('/<\?xml[^>]*\?>/','',$doc->saveHTML());
