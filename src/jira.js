class JiraIssue {
    constructor() {
        //
    }

    getColorByPriority(priority) {
        switch (priority) {
            default:
            case 'Low':
                return 0x9AA1B1;
            case 'Medium':
                return 0x30873A;
            case 'High':
                return 0xCC0814;
        }
    }

    getIssueComponents(components) {
        return components ? components.map((c) => c.name).join(' • ') : 'no components set';
    }

    getIssueDescription(description, navLink) {
        return description ? description.substring(0, 150) + (description.length > 150 ? `.. [more](${navLink})` : '') : '';
    }

    getIssueSubtasks(subtasks) {
        const items = [];
        for (const s of subtasks) {
            items.push(`${s.key} ${s.fields.summary} - ${s.fields.status.name}`)
        }
        return items.join('\n');
    }

    formatByStatus(value, status) {
        let result = value;
        if (status === 'Done') {
            result = this.wrapBy(result, '~~');
        }
        if (status === 'In Progress') {
            result = this.wrapBy(result, '*');
        }
        if (status === 'on hold') {
            result = this.wrapBy(result, '**');
        }
        return result;
    }

    wrapBy(value, str) {
        return `${str}${value}${str}`;
    }
}

module.exports = JiraIssue;
