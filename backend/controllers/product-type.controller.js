import { insertProductType, getAllProductTypes, getProductTypeById, updateProductType, deleteProductType } from '../models/product-type.model.js';



export const createProductType = async (req, res) => {
    try {
        const { name, description,type } = req.body;

        const productTypeId = await insertProductType({ name, description, type });

        return res.status(201).json({ message: ' product type created successfully', productTypeId });

    } catch (error) {
        console.error('Error creating product Type:', error);
        return res.status(500).json({ message: "Internal server error" });

    }

};

export const getProductTypes = async (req, res) => {
    try {
        const productTypes = await getAllProductTypes();
        return res.status(200).json(productTypes);
    } catch (error) {
        console.error("Error fetching product types:", error);
        return res.status(500).json({ message: "Internal server error" });

    }

};

export const getproductTypeByIds = async (req, res) => {

    try {
        const { id } = req.params;
        const productType = await getProductTypeById(id);

        if (!productType) {
            return res.status(404).json({ message: "product type not found" });
        }

        return res.status(200).json(productType);
    } catch (error) {
        console.error("Error fetching product type:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updateProductTypeController = async (req,res)=>{

    try {
        const {id} = req.params;

        const {name, description ,type}= req.body;

        const existingProductType = await getProductTypeById(id);

        if(!existingProductType){
            return res.status(404).json({message: "product type not found"});
        }

        await updateProductType(id, {name, description, type});

        return res.status(200).json({message:"product type updated successfully"});
    } catch (error) {
        console.error( "Error updating product type:", error);
        return res.status(500).json({message: "Internal server error"});

    
    }
}


export const deleteProductTypeController = async (req, res) => {

    try {
        const {id } = req.params;

        const existingProductType = await getProductTypeById(id);

        if(!existingProductType){
            return res.status(404).json({message: "product type not found"});
        }

        await deleteProductType(id);
        return res.status(200).json({message: "product type deleted successfully"});

    } catch (error) {
        console.error("Error deleting product type:", error);
        return res.status(500).json({message: "Internal server error"});
    
    }
}

