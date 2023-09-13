export class Joplin {
    constructor(configNoteId, rootFolder, token, port_number) {
        this.configNoteId = configNoteId;
        this.rootFolder = rootFolder;
        this.token = token;
        this.port_number = port_number;
        this.urlBase = `http://127.0.0.1:${this.port_number}`
    }

    _getURL(path, params) {
        let url = new URL(`http://127.0.0.1:${this.port_number}${path}`)
        url.searchParams.append("token", this.token)
        if (params) {
            Object.keys(params).forEach((k) => url.searchParams.append(k, params[k]))
        }
        return url.toString()
    }

    getNoteById(id) {
        axios.get(this._getURL(`/notes/${id}`, { fields: "body,title" }))
            .then(function (response) {
                return response.data;
            })
    }

    updateNoteById(id, title, body) {
        axios.put(
            this._getURL(`/notes/${id}`),
            {
                body: body,
                title: title
            }
        );
    }

    deleteNote(id) {
        if (confirm("Delete this note?") === true) {
            axios.delete(this._getURL(`/notes/${id}`)
                .then(function (response) {
                    console.log(`Deleted note ${id}`);
                })
            )
        }
    }

    createNote(title, body) {
        window.newNoteModal.hide();

        let postData = {
            parent_id: this.rootFolder,
            title: title,
            body: body
        }

        axios.post(this._getURL("/notes"), postData)
            .then(function (response) {
                console.log(`Created note ${response.data.id}`);
                return response.data.id
            })
    }

    getAllNotesFromFolder(id) {
        axios.get(
            this._getURL(`/folders/${id}/notes`, { fields: "id,title,body" })
        )
            .then(function (response) {
                return response.data.items;
            })
    }

    getAllNotesFromRootFolder() {
        return this.getAllNotesFromFolder(this.rootFolder);
    }

    getFolders() {
        axios.get(
            this._getURL(`/folders`).then(function (response) {
                return response.data.items;
            })
        )
    }

    validateConnection() {
        try {
            getFolders();
        } catch (error) {
            return false
        }
        return true
    }
}
