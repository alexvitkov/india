<div>
    <div class="filesystem">
        <h2 style="display: flex; gap: 1rem;">
            <div class="path">
                <a class="pathentry" href="#"> <?php echo $_SESSION['username'] ?>'s files/</a><a class="pathentry" href="#">foo/</a><a class="pathentry" href="#">bar</a></div>
            <input id="upload_btn" type="button" value="Upload" onclick="begin_upload()">
        </h2>

        <div class="files" id="current_directory">
        </div>
    </div>

</div>

<form id="upload_form" style="display:none;" action="php/upload.php" method="post">
    <input id="filename" name="filename">
    <input type="file" name="the_file" id="the_file">
</form>

<script src="loggedin.js"></script>
