<?php
require __DIR__.'/bootstrap.php';header('Content-Type: application/javascript; charset=utf-8');
foreach(['PRODUCTS','PRODUCT_PURCHASE_LINKS'] as $var){$q=db()->prepare('SELECT field_key,prop,value FROM cms_content WHERE page=?');$q->execute([strtolower($var)]);$data=[];foreach($q as $f)$data[$f['field_key']][$f['prop']]=$f['value'];echo 'window.CMS_'.$var.'='.json_encode($data,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).';';}
