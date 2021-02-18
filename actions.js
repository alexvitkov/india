
// Patterns in the URL:
// $fileanme           - filename
// $content_urlencoded - file contents, urlencoded
// $content_base64     - file contents, base64'd

const actions = [
    {
        "extension": ".txt",
        "text": "Google search filename",
        "url": "https://www.google.com/search?q=$filename"
    },
    {
        "extension": ".txt",
        "text": "Google search contents",
        "url": "https://www.google.com/search?q=$filename"
    }
];
