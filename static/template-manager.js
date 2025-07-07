// Template manager
class TemplateManager {
    buildTemplate(templateData) {
        window.joplinIntegration.config = {title: "My Story", data: []};
        templateData.forEach((title) => {
            window.joplinIntegration.config.data.push({
                "id": crypto.randomUUID(),
                "title": title,
                "item": []
            })
        })
        window.kanbanBoard.init(window.joplinIntegration.config);
        window.modalManager.hidePremadeModal();
        if (typeof window.kanbanBoard.saveBoardState === 'function') {
            window.kanbanBoard.saveBoardState();
        }
    }

    templateHerosJourney() {
        this.buildTemplate([
            "Call to Adventure",
            "Refusal of Call",
            "Supernatural Aid/Mentor",
            "Road of Trials",
            "Crossing the Threshold",
            "Death of Mentor",
            "Ordeal",
            "Temptation",
            "Battle with the Brother",
            "Refusal to Return",
            "Road Back",
            "Master of Two Worlds",
            "Ultimate Reward",
        ])
    }

    templateHeroinesJourney() {
        this.buildTemplate([
            "The Illusion",
            "Betrayal",
            "The Awakening",
            "The Descent",
            "Eye of the Storm",
            "All is Lost",
            "Support",
            "Moment of Truth",
            "The Return",
        ])
    }

    templateRomancingTheBeat() {
        this.buildTemplate([
            "Setup: Introduce H1",
            "Introduce H2",
            "Meet Cute",
            "No Way 1",
            "Adhesion",
            "Falling in Love: No Way 2",
            "Inkling of Desire",
            "Deepening Desire",
            "Maybe This Could Work",
            "Midpoint of Love",
            "Retreating from Love: Inkling of Doubt",
            "Deepening Doubt",
            "Retreat Beat",
            "Shields Up",
            "Break Up",
            "Fighting for Love: Dark Night",
            "Wake Up",
            "Grand Gesture",
            "What Whole-Hearted Looks Like",
            "Epilogue"
        ])
    }

    templateThreeActStructure() {
        this.buildTemplate([
            "Act 1: Beginning",
            "Inciting Incident",
            "Second Thoughts",
            "Climax of Act 1",
            "Act 2: Obstacle",
            "Obstacle 2",
            "Midpoint (Big Twist)",
            "Obstacle 3",
            "Disaster",
            "Crisis",
            "Climax of Act 2",
            "Act 3: Climax",
            "Wrap-up",
            "End"
        ])
    }

    templateSaveTheCat() {
        this.buildTemplate([
            "Act 1: Opening Image",
            "Theme Stated",
            "Set-up",
            "Catalyst",
            "Debate",
            "Act 2: B Story",
            "Fun and Games",
            "Midpoint",
            "Bad Guys Close In",
            "All is Lost",
            "Dark Night of the Soul",
            "Act 3: Finale",
            "Final Image"
        ])
    }

    templateJamiGoldRomanceBeats() {
        this.buildTemplate([
            "Act 1: Opening Hook",
            "Inciting Incident",
            "End of the Beginning",
            "Act 2: Pinch Point 1",
            "Midpoint",
            "Pinch Point 2",
            "Crisis",
            "Act 3: Climax",
            "Final Resolution"
        ])
    }

    templateShortStoryRomance() {
        this.buildTemplate([
            "Intro to H1 & H2 ",
            "Meet Cute",
            "Falling in Love (First Kiss)",
            "Internal Conflict",
            "Falling in Love (Intimacy)",
            "Dark Moment",
            "Resolution / Wakeup",
            "HEA / Grand Gesture",
        ])
    }
}

window.templateManager = new TemplateManager();
