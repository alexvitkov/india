<div>
    <div class="filesystem">
        <h2 style="display: flex; gap: 0rem;">
            <button id="upload_btn" onclick="begin_upload()">Upload</button>
            <div class="separator"></div>
            <button id="upload_btn" onclick="new_folder()">New Folder</button>
            <div class="separator"></div>
            <div class="path" id="the_path">
                <button class="pathentry" id="home_path_entry">
		<?php
		$user=$_SESSION['user_object'];
		echo $user->username;
	       	?>
		's files</button>
            </div>
        </h2>

        <div class="files" id="current_directory">
        </div>
    </div>

</div>

<form id="upload_form" style="display:none;" action="php/upload.php" method="post" enctype="multipart/form-data">
    <input id="filename" name="filename">
    <input type="file" name="the_file" id="the_file">
    <input name="parent_directory" id="upload_parent_directory">
</form>


<script src="loggedin.js"></script>
