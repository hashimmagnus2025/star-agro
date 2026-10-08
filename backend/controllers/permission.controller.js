
import { 
  insertPermission as createPermissionInDB, 
  getPermissionById as getPermissionByIdDB, 
  getAllPermissions as getAllPermissionsDB, 
  updatePermission as updatePermissionDB, 
  deletePermission as deletePermissionDB 
} from '../models/permissions.model.js';

export const createPermission = async (req,res) =>{

    try {
        const {name, description}= req.body;

        if(!name || !description){
            return res.status(400).json({message: 'Name and description are required'});
        }
        const newPermission = {
            name,
            description
            
        }
        const result = await createPermissionInDB(newPermission);
        res.status(201).json({message: 'Permission created successfully', permissionId: result.insertId});

    } catch (error) {
        console.error('Error creating permission:', error);
        res.status(500).json({message: 'Internal server error'});
    }
};

export const getPermissionById = async (req, res) =>{

    try {
        const {id} = req.params;
        const permission = await getPermissionByIdDB(id);

        if(!permission){
            return res.status(404).json({message: 'Permission not found'});
        }   
        res.status(200).json(permission);
    } catch (error) {
        console.error('Error fetching permission:', error);
        res.status(500).json({message: 'Internal server error'});
    }
};

export const getAllPermissions = async ( req,res) =>{

    try {
        const permissions = await getAllPermissionsDB();
        res.status(200).json(permissions);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({message: 'Internal server error'});
    }
};

export const updatePermission = async (req, res) =>{

    try {
        const {id} = req.params;
        const {name,description} = req.body;

        if(!name || !description){
            return res.status(400).json({message: 'Name and description are required'});
        }
         const updatedPermission = {
            name,
            description,
            
        }
        const result = await updatePermissionDB(id, updatedPermission);        
        if(result.affectedRows === 0){
            return res.status(404).json({message: 'Permission not found or no changes made'});
        }   
        res.status(200).json({message: 'Permission updated successfully'});
    } catch (error) {
        console.error('Error updating permission:', error);
        res.status(500).json({message: 'Internal server error'});
    }   
};

export const deletePermission = async (req, res)=>{

    try {
        const {id} = req.params;

        const result = await deletePermissionDB(id);

        if(result.affectedRows === 0){
            return res.status(404).json({message: 'Permission not found or already deleted'});
        }
        res.status(200).json({message: 'Permission deleted successfully'});
    } catch (error) {
        console.error('Error deleting permission:', error);
        res.status(500).json({message: 'Internal server error'});
    }
}



    
