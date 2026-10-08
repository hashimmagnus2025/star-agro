import { insertRole as insertRoleModel, createRolesTable, getAllRoles as getAllRolesModel, getRoleById as getRoleByIdModel, updateRole as updateRoleModel, deleteRole as deleteRoleModel } from "../models/role.model.js";


export const createRole = async (req, res) =>{

    try {

        const {name, description, permissions} = req.body;
        // Accept permissions as array (from frontend) or comma-separated string
        let permissionsString = '';
        if (Array.isArray(permissions)) {
            permissionsString = permissions.join(',');
        } else if (typeof permissions === 'string') {
            permissionsString = permissions;
        }

        if (!name || !description || !permissionsString) {
            return res.status(400).json({message: 'Name, description and permissions are required'});
        }

        const newRole = {
            name,
            description,
            permissions: permissionsString
        }
        const result = await insertRoleModel(newRole);
        res.status(201).json({message: 'Role created successfully', roleId: result.insertId});  
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({message: 'Internal server error'});

    };

};


export const getRoleById = async (req,res) =>{

    try {
        const {id} =req.params;
        const role = await getRoleByIdModel(id);

        if(!role){
            return res.status(404).json({message: 'Role not found'});
        }
        res.status(200).json(role);
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({message: 'Internal server error'});
    }
}

export const getAllRoles = async (req,res) =>{
    try {
        const roles = await getAllRolesModel();
        res.status(200).json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({message: 'Internal server error'});
    }
}

export const updateRole = async (req,res)=>{

    try {
        const {id} = req.params;
        const {name, description, permissions}= req.body;
        // Accept permissions as array or comma-separated string
        let permissionsString = '';
        if (Array.isArray(permissions)) {
            permissionsString = permissions.join(',');
        } else if (typeof permissions === 'string') {
            permissionsString = permissions;
        }

        if (!name || !description || !permissionsString) {
            return res.status(400).json({message: 'Name, description and permissions are required'});
        }

        const updatedRole = {
            name,
            description,
            permissions: permissionsString
        }
        const result = await updateRoleModel(id, updatedRole);
        if(result.affectedRows === 0){
            return res.status(404).json({message: 'Role not found or no changes made'});
        }
        res.status(200).json({message: 'Role updated successfully'});
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({message: 'Internal server error'});   

    };

}

export const deleteRole = async (req,res)=>{

    try {
        const {id}= req.params;

        const result = await deleteRoleModel(id);;
        if(result.affectedRows === 0){
            return res.status(404).json({message: 'Role not found or already deleted'});
        }
        res.status(200).json({message: 'Role deleted successfully'});
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({message: 'Internal server error'});
    }
}

