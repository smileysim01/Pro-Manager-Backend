const User = require("../schema/user.schema");

const fillAssignedUsers = async (assignTo, taskID) => {
    const assignToArray = assignTo ? assignTo.split(",").map((item) => item.trim()) : [];
    const validAssignees = [];
    const validAssigneesId = [];
    for (let email of assignToArray) {
        let assignee = await User.findOne({email: email});
        if (!assignee) {
            throw new Error(`Assigned user ${assigneeEmail} is not registered.`);
        }
        validAssignees.push(assignee);
        validAssigneesId.push(assignee._id);
    }
    for (let assignee of validAssignees) {
        if(!assignee.tasks.includes(taskID)){
            assignee.tasks.push(taskID);
            await assignee.save();
        }
    }
    return {validAssignees, validAssigneesId};
}

module.exports = fillAssignedUsers;