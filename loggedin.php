
<div class="backdrop">

<form id="upload_form" style="display:none;" action="php/upload.php" method="post" enctype="multipart/form-data">
    <input type="file"   name="the_file"         id="the_file">
    <input type="hidden" name="filename"         id="filename">
    <input type="hidden" name="overwrite"        id="override_input">
    <input type="hidden" name="parent_directory" id="upload_parent_directory">
</form>

<script src="actions.js"></script>
<script src="loggedin.js"></script>
