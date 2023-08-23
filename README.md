# Joplin Kanbaninator

[Joplin](https://joplinapp.org/) is a personal note-taking app that I quite enjoy! It has a kanban plugin, but the plugin is pretty broken and I don't know enough modern JS to fix it. What I do know is vanilla JS, so here's a kanban web UI for your locally-running Joplin instance! It's not sexy but it works and that's what's important.

## Setup

Start by creating an empty notebook. This is the 'root' of your kanban board. No other setup is necessary.

You will also need to enable the Joplin Web Clipper service. Go to **Tools > Options > Web Clipper** and enable the service. Note what port it's running on -- you'll need that to connect in a minute.

## Using the Thing

In your browser, go to [https://itsthejoker.github.io/kanbaninator/](https://itsthejoker.github.io/kanbaninator/). It will ask you for the port first, then try to connect to Joplin.

If everything works, you'll next be presented with a graphical representation of all your notebooks. Select the one that you created as the root of your board. It will automatically detect the sub-notebooks and assign them as columns.

Click any of the green buttons on top of the columns to create a new card - that card will automatically be created in the correct notebook. Moving a card between columns will also move the note in Joplin.

I wrote this for myself as a weekend project. I don't expect to provide long-term maintenance or really any kind of support. You're welcome to use it with your stuff, though!