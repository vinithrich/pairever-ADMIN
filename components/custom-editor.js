// components/custom-editor.js
'use client' // only in App Router

import {
    ClassicEditor, Alignment, BlockQuote, Bold, Code, CodeBlock, Essentials,
    FontBackgroundColor, FontColor, FontFamily, FontSize,
    Heading, Highlight, Image, ImageUpload, Italic, Link,
    List, MediaEmbed, Mention, Paragraph, RemoveFormat,
    Strikethrough, Subscript, Superscript, Table, TodoList,
    Underline, Undo,SourceEditing   
} from 'ckeditor5';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import 'ckeditor5/ckeditor5.css';
import 'ckeditor5-premium-features/ckeditor5-premium-features.css';

function CustomEditor({ handleEditorChange, editorblogdata }) {

    const editorConfiguration = {
        toolbar: {
            items: [
                'heading', '|',
                'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
                'link', 'blockquote', 'code', 'codeBlock', '|',
                'bulletedList', 'numberedList', 'todoList', '|',
                'imageUpload', 'insertTable', 'mediaEmbed', '|',
                'alignment', 'fontBackgroundColor', 'fontColor', 'fontSize', 'fontFamily', '|',
                'highlight', '|',
                'removeFormat', '|',
                'sourceEditing', '|',
                'undo', 'redo'
            ]
        },
        plugins: [
            Alignment, BlockQuote, Bold, Code, CodeBlock, Essentials,
            FontBackgroundColor, FontColor, FontFamily, FontSize,
            Heading, Highlight, Image, ImageUpload, Italic, Link,
            List, MediaEmbed, Mention, Paragraph, RemoveFormat,
            Strikethrough, Subscript, Superscript, Table, TodoList,
            Underline, Undo,SourceEditing
        ],
        image: {
            toolbar: [
                'imageTextAlternative', 'imageStyle:full', 'imageStyle:side'
            ]
        },
        table: {
            contentToolbar: [
                'tableColumn', 'tableRow', 'mergeTableCells'
            ]
        },
        simpleUpload: {
            uploadUrl: '/upload', // Change to your upload endpoint
            headers: {
                'X-CSRF-TOKEN': 'CSRF-Token',
                Authorization: 'Bearer <JSON Web Token>'
            }
        },
        mention: {
            // Mention configuration if needed
        },
    };


    return (
        <CKEditor
            editor={ClassicEditor}
            config={editorConfiguration}
            data={editorblogdata || ""}
            onChange={(event, editor) => {
                const data = editor.getData();
                handleEditorChange(data);
            }}
        />
    );
}

export default CustomEditor;
