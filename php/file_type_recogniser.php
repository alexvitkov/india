<?php

function file_type($path_to_file) {
	$file_type_database = new finfo(FILEINFO_SYMLINK|FILEINFO_MIME_TYPE);
	return $file_type_database->file($path_to_file);
}


function file_extension($path_to_file) {
	#FILEINFO_EXTENSION introduced in php7.2.0 https://www.php.net/manual/en/fileinfo.constants.php
	if(defined("FILEINFO_EXTENSION"))
	{
		$file_type_database = new finfo(FILEINFO_EXTENSION);
		return "." . $file_type_database->file($path_to_file);
	}else
	{
		$result=file_type($path_to_file);

		$optimus_prime = array(
			'text/plain'=>'.txt',
			'text/html'=>'.html',
			'text/php'=>'.php',
			'text/css'=>'.css',
			'application/javascript'=>'.js',
			'application/json'=>'.json',
			'application/xml'=>'.xml',
			'application/x-shockwave-flash'=>'.swf',
			'video/x-flv'=>'.flv',
			'image/png'=>'.png',
			'image/jpeg'=>'.jpe',
			'image/jpeg'=>'.jpeg',
			'image/jpeg'=>'.jpg',
			'image/gif'=>'.gif',
			'image/bmp'=>'.bmp',
			'image/vnd.microsoft.icon'=>'.ico',
			'image/tiff'=>'.tiff',
			'image/tiff'=>'.tif',
			'image/svg+xml'=>'.svg',
			'image/svg+xml'=>'.svgz',
			'application/zip'=>'.zip',
			'application/x-rar-compressed'=>'.rar',
			'application/x-msdownload'=>'.exe',
			'application/x-msdownload'=>'.msi',
			'application/vnd.ms-cab-compressed'=>'.cab',
			'audio/mpeg'=>'.mp3',
			'video/quicktime'=>'.qt',
			'video/quicktime'=>'.mov',
			'application/pdf'=>'.pdf',
			'image/vnd.adobe.photoshop'=>'.psd',
			'application/postscript'=>'.ai',
			'application/postscript'=>'.eps',
			'application/postscript'=>'.ps',
			'application/msword'=>'.doc',
			'application/rtf'=>'.rtf',
			'application/vnd.ms-excel'=>'.xls',
			'application/vnd.ms-powerpoint'=>'.ppt',
			'application/vnd.oasis.opendocument.text'=>'.odt',
			'application/vnd.oasis.opendocument.spreadsheet'=>'.ods'
		);

		if(!array_key_exists($result,$optimus_prime))
		{
			return ".dat";
		}else
		{
			return $optimus_prime[$result];
		}

	}
}

function get_icon($path_to_file)
{
	$file_ext="svg/icons/".file_extension($path_to_file).".svg";
	if(!file_exists($file_ext))
	{
		return "svg/icons/.dat.svg";
	}else
	{
		return $file_ext;
	}
}

?>
