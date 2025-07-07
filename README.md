# Joplin Kanbaninator

[Joplin](https://joplinapp.org/) is a personal note-taking app that I quite enjoy! It has a kanban plugin, but the plugin is pretty broken and I don't know enough modern JS to fix it. What I do know is vanilla JS, so here's a kanban web UI for your locally-running Joplin instance! It's not sexy but it works and that's what's important.

## Setup

Start by creating an empty notebook. This is the 'root' of your kanban board. No other setup is necessary.

You will also need to enable the Joplin Web Clipper service. Go to **Tools > Options > Web Clipper** and enable the service. Note what port it's running on -- you'll need that to connect in a minute.

## Using Kanbaninator

1. Visit [https://itsthejoker.github.io/kanbaninator/](https://itsthejoker.github.io/kanbaninator/) in your browser
2. Enter the Joplin Web Clipper port number when prompted
3. Authorize the connection in your Joplin app when requested
4. Select the notebook you created as the root for your board
5. Choose a template or start with a blank board

### Working with Your Board

- **Adding Cards**: Click the green "+" button on any column
- **Editing Cards**: Click on any card to view or edit its contents
- **Context Menu**: Right-click on any card for quick actions (edit, delete, change color, copy ID)
- **Moving Cards**: Drag and drop cards between columns
- **Changing Card Color**: Either use the context menu color picker for quick changes or select from 12 color options when editing a card
- **Board Customization**: Click on the board title to rename it

### Templates

Kanbaninator includes several built-in templates for writers:

- Hero's Journey
- Heroine's Journey 
- Three-Act Structure
- Save the Cat
- Romancing the Beat
- Jami Gold's Romance Beats
- Novelette Romance Beats

## Development

Kanbaninator is an open-source project built with vanilla JavaScript, Bootstrap, and the jKanban library. It communicates with your local Joplin instance through the Web Clipper API.

Contributions and improvements are welcome!

## License

MIT License - Feel free to use, modify and distribute as needed.