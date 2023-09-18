import { Joplin } from "./joplin.js";
import { CustomModal } from "./modal.js";
import Spinner from "./spinner.js";
import { getCookie } from "./utils.js";
console.log("hi");

const spinner = new Spinner();
let joplin = new Joplin();
window.spinner = spinner;

const startModal = new CustomModal("start")
startModal.setBody(
    `<p>
        Welcome to Kanbaninator for <a href="https://joplinapp.org/" target="_blank">Joplin</a>!
        Joplin is a note-taking app that lets you keep complete control of your data, and this
        app gives you a way to organize some of that data in a kanban-style board while ensuring
        you keep your data where it should stay: with you.
    </p>
    <p>
        <strong>Setup:</strong> in Joplin, create an empty notebook that will be your 'base' for
        the board.
    </p>
    <p>
        Kanbaninator uses the 'web clipper' service system that's built into Joplin to interact
        with your notes. On your desktop app, go to <strong>Tools > Options > Web Clipper</strong>,
        then enable the service if it isn't already enabled. You'll only need one thing here to
        get started: what is the port number displayed?
    </p>
    <div class="input-group mb-3">
        <span class="input-group-text" id="joplin_port_number">Port Number</span>
        <input type="text" class="form-control" aria-label="Sizing example input"
               aria-describedby="joplin_port_number" value="41184">
    </div>
    <p>
        You should see a dialogue appear in your Joplin app asking if you want to authorize the
        Web Clipper connection; click "Grant Authorisation" to get started.
    </p>
    <p style="display: none" id="portNumberError"></p>`
);
startModal.setTitle("Joplin Kanbaninator");
startModal.setFooter(
    `<button type="button" class="btn btn-primary" onclick="
        (function(){
            let port_number = document.getElementById('joplin_port_number').nextElementSibling.value;
            if (!(window.isNaN(port_number))) {
                spinner.show();
                startModal.hide();
                joplin = new Joplin(null, null, null, port_number);
            } else {
                let errorp = document.getElementById('portNumberError');
                errorp.style.display = 'block';
                errorp.textContent = 'That\\'s not a number. Please put in a port number.'
            }
        })();
    ">Authenticate</button>`
);

const folderModal = new CustomModal("folder");
folderModal.setTitle("What Notebook Are You Working In?");
folderModal.setBody(
    `<div class="modal-header">
        <h1 class="modal-title fs-5" id="folderModalLabel">What Notebook Are You Working In?</h1>
    </div>
    <div class="modal-body">
        <p>
            Here are the notebooks we can see. Which notebook is the root notebook for your
            kanban board?
        </p>
        <p>
            If we don't detect a configuration note, we'll go ahead and create one.
        </p>
        <ul id="folderList"></ul>
    </div>`
);

const titleModal = new CustomModal("title");
titleModal.setTitle("Change Board Title");
titleModal.setBody(
    `<div class="input-group mb-3">
        <span class="input-group-text" id="currentBoardTitle">Title</span>
        <input type="text" class="form-control" aria-label="Title of the board" id="boardTitleField"
               aria-describedby="currentBoardTitle">
    </div>`
)
titleModal.setFooter(
    `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    <button type="button" class="btn btn-primary" onclick="updateBoardTitle()">Save changes</button>`
)

const editNoteModal = new CustomModal("editNote");
editNoteModal.setTitle("View / Edit Note");
editNoteModal.setBody(
    `<div class="input-group mb-3">
        <span class="input-group-text" id="currentNoteTitle">Title</span>
        <input type="text" class="form-control" aria-label="Title of the note" id="noteTitleField"
               aria-describedby="currentNoteTitle">
    </div>
    <div class="form-floating">
        <div id="currentNoteId" class="d-none"></div>
        <textarea class="form-control" placeholder="Leave a comment here" id="noteBodyField"
                  style="height: 150px"></textarea>
        <label for="noteBodyField">Note Body</label>
    </div>`
);
editNoteModal.addColors("edit");
editNoteModal.setFooter(
    `<button type="button" class="btn btn-danger"
        onclick="(function(){ joplin.deleteNote(document.getElementById('currentNoteId').innerText) })();"
    >Delete</button>
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    <button type="button" class="btn btn-primary"
        onclick="
            (function(){
                joplin.updateNoteById(document.getElementById('currentNoteId').innerText, 
                    document.getElementById('noteTitleField').innerText,
                    document.getElementById('noteBodyField').innerText
                )}
            )();"
    >Save changes</button>`
)

function getConfigDataFromNote(body) {
    const config = body.split('\n');
    const firstIndex = config.findIndex(element => element === '```json');
    const lastIndex = config.findLastIndex(element => element === '```');
    let data = config.slice(firstIndex + 1, lastIndex).join('');
    return JSON.parse(data);
}

const joplinToken = getCookie("joplinToken");
const joplinPort = getCookie("joplinPort");
const params = new URLSearchParams(window.location.search);
console.log(joplinToken, joplinPort, params.get("configNoteId"));

if (joplinToken && joplinPort) {
    window.token = joplinToken;
    window.port_number = joplinPort;

    if (params.get("configNoteId")) {
        window.rootFolder = params.get("rootFolder");
        window.configNoteId = params.get("configNoteId");
        const configNoteData = joplin.getNoteById(window.configNoteId)
        const configData = getConfigDataFromNote(configNoteData.body);
        console.log(configData)
    }

    getFolders();
    folderModal.show();
} else {
    startModal.show();
}
