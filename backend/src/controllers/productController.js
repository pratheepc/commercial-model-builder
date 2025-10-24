import { ProductService } from '../models/ProductService.js';

export class ProductController {
  constructor() {
    this.productService = new ProductService();
  }

  getAllProducts = async (req, res) => {
    try {
      const products = await this.productService.getAllProducts();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  getProductById = async (req, res) => {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  createProduct = async (req, res) => {
    try {
      const productData = req.body;
      const newProduct = await this.productService.createProduct(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  updateProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedProduct = await this.productService.updateProduct(id, updateData);
      if (!updatedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json(updatedProduct);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await this.productService.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(204).send(); // No content
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}
