import { Projection } from './MongoModels.js';

export class ProjectionService {
  async createProjection(projectionData) {
    try {
      const newProjection = new Projection(projectionData);
      const savedProjection = await newProjection.save();
      return savedProjection;
    } catch (error) {
      console.error('Error creating projection:', error);
      throw error;
    }
  }

  async getProjectionsByModel(modelId) {
    try {
      const projections = await Projection.find({ model_id: modelId }).sort({ createdAt: -1 });
      return projections;
    } catch (error) {
      console.error('Error fetching projections by model:', error);
      throw error;
    }
  }

  async getProjectionById(id) {
    try {
      const projection = await Projection.findById(id);
      return projection;
    } catch (error) {
      console.error('Error fetching projection by ID:', error);
      throw error;
    }
  }

  async deleteProjection(id) {
    try {
      const deletedProjection = await Projection.findByIdAndDelete(id);
      return deletedProjection !== null;
    } catch (error) {
      console.error('Error deleting projection:', error);
      throw error;
    }
  }

  async getAllProjections() {
    try {
      const projections = await Projection.find().sort({ createdAt: -1 });
      return projections;
    } catch (error) {
      console.error('Error fetching all projections:', error);
      throw error;
    }
  }

  async updateProjection(id, updateData) {
    try {
      const updatedProjection = await Projection.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );
      return updatedProjection;
    } catch (error) {
      console.error('Error updating projection:', error);
      throw error;
    }
  }
}
