const User = require("../schema/user.schema");

const removeAssignedUsers = async (taskID, removeAssignees) => {
    for(let id of removeAssignees){
        let assignee = await User.findOne({id});
        if(assignee){
            assignee.tasks = assignee.tasks.filter(ID => ID.toString() !== taskID.toString());
            await assignee.save();
        }
    }
    
}

module.exports = removeAssignedUsers;