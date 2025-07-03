const Business = require('../models/business.model');
const Location = require('../models/location.model');
const Category = require('../models/category.model');

// Get all businesses with map data
exports.getBusinessesForMap = async (req, res) => {
  try {
    const { 
      categoryId, 
      bounds, // { north, south, east, west }
      radius, // in kilometers
      center, // { lat, lng }
      verified = null 
    } = req.query;

    let filter = {};

    // Filter by category
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Filter by verification status
    if (verified !== null) {
      filter.isVerified = verified === 'true';
    }

    // Base query to get businesses with coordinates
    let query = Business.find(filter);

    // Add location filters if provided
    if (bounds) {
      try {
        const { north, south, east, west } = JSON.parse(bounds);
        filter.$or = [
          // Business has direct coordinates
          {
            'businessLocation.coordinates.latitude': { $gte: parseFloat(south), $lte: parseFloat(north) },
            'businessLocation.coordinates.longitude': { $gte: parseFloat(west), $lte: parseFloat(east) }
          },
          // Business uses location reference
          {
            'businessLocation.coordinates': { $exists: false },
            locationId: { $exists: true }
          }
        ];
      } catch (error) {
        return res.status(400).json({ message: 'Invalid bounds format' });
      }
    }

    const businesses = await Business.find(filter)
      .populate('categoryId', 'name')
      .populate('locationId', 'name coordinates address formattedAddress')
      .populate('ownerId', 'name email')
      .select('name description isVerified businessLocation contactInfo operatingHours averageRating totalReviews')
      .lean();

    // Format businesses for map display
    const mapMarkers = businesses
      .map(business => {
        // Use business-specific location or fall back to general location
        const coordinates = business.businessLocation?.coordinates || business.locationId?.coordinates;
        
        if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
          return null; // Skip businesses without coordinates
        }

        return {
          id: business._id,
          name: business.name,
          description: business.description,
          category: business.categoryId?.name,
          isVerified: business.isVerified,
          coordinates: {
            lat: coordinates.latitude,
            lng: coordinates.longitude
          },
          address: business.businessLocation?.formattedAddress || 
                  business.locationId?.formattedAddress ||
                  business.businessLocation?.address ||
                  business.locationId?.address,
          contactInfo: business.contactInfo,
          operatingHours: business.operatingHours,
          rating: {
            average: business.averageRating,
            total: business.totalReviews
          },
          owner: business.ownerId?.name
        };
      })
      .filter(marker => marker !== null); // Remove businesses without coordinates

    // If radius and center are provided, filter by distance
    if (radius && center) {
      try {
        const { lat, lng } = JSON.parse(center);
        const radiusKm = parseFloat(radius);
        
        const filteredMarkers = mapMarkers.filter(marker => {
          const distance = calculateDistance(
            lat, lng,
            marker.coordinates.lat, marker.coordinates.lng
          );
          return distance <= radiusKm;
        });
        
        res.json({
          markers: filteredMarkers,
          total: filteredMarkers.length,
          filters: { categoryId, radius: radiusKm, center: { lat, lng }, verified }
        });
      } catch (error) {
        return res.status(400).json({ message: 'Invalid center or radius format' });
      }
    } else {
      res.json({
        markers: mapMarkers,
        total: mapMarkers.length,
        filters: { categoryId, bounds, verified }
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get business details for map info window
exports.getBusinessMapDetails = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId)
      .populate('categoryId', 'name')
      .populate('locationId', 'name coordinates address formattedAddress')
      .populate('ownerId', 'name email');

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Get recent reviews for the business
    const Review = require('../models/review.model');
    const recentReviews = await Review.find({ businessId })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
      .select('rating comment createdAt');

    // Get products/services count
    const Sellable = require('../models/sellable.model');
    const productsCount = await Sellable.countDocuments({ businessId });
    const servicesCount = await Sellable.countDocuments({ businessId, type: 'service' });

    const coordinates = business.businessLocation?.coordinates || business.locationId?.coordinates;

    const mapDetails = {
      id: business._id,
      name: business.name,
      description: business.description,
      category: business.categoryId?.name,
      isVerified: business.isVerified,
      coordinates: coordinates ? {
        lat: coordinates.latitude,
        lng: coordinates.longitude
      } : null,
      address: business.businessLocation?.formattedAddress || 
              business.locationId?.formattedAddress ||
              business.businessLocation?.address ||
              business.locationId?.address,
      contactInfo: business.contactInfo,
      operatingHours: business.operatingHours,
      rating: {
        average: business.averageRating,
        total: business.totalReviews
      },
      owner: {
        name: business.ownerId?.name,
        email: business.ownerId?.email
      },
      stats: {
        products: productsCount,
        services: servicesCount
      },
      recentReviews
    };

    res.json(mapDetails);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Search businesses near a location
exports.searchBusinessesNearLocation = async (req, res) => {
  try {
    const { address, radius = 10, categoryId } = req.query;

    if (!address) {
      return res.status(400).json({ message: 'Address is required for location search' });
    }

    // This would typically use Google Geocoding API to convert address to coordinates
    // For now, we'll return all businesses and let the frontend handle geocoding
    const filter = {};
    
    if (categoryId) {
      filter.categoryId = categoryId;
    }

    const businesses = await Business.find(filter)
      .populate('categoryId', 'name')
      .populate('locationId', 'name coordinates address formattedAddress')
      .populate('ownerId', 'name')
      .select('name description isVerified businessLocation contactInfo averageRating totalReviews')
      .lean();

    const results = businesses
      .map(business => {
        const coordinates = business.businessLocation?.coordinates || business.locationId?.coordinates;
        
        if (!coordinates) return null;

        return {
          id: business._id,
          name: business.name,
          description: business.description,
          category: business.categoryId?.name,
          isVerified: business.isVerified,
          coordinates: {
            lat: coordinates.latitude,
            lng: coordinates.longitude
          },
          address: business.businessLocation?.formattedAddress || 
                  business.locationId?.formattedAddress ||
                  business.businessLocation?.address ||
                  business.locationId?.address,
          rating: {
            average: business.averageRating,
            total: business.totalReviews
          }
        };
      })
      .filter(business => business !== null);

    res.json({
      searchQuery: { address, radius, categoryId },
      results,
      total: results.length,
      message: 'Use Google Geocoding API on frontend to filter by actual distance'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get map configuration and API settings
exports.getMapConfig = async (req, res) => {
  try {
    // Get categories for map filters
    const categories = await Category.find().select('name').lean();
    
    // Get center coordinates (could be based on most businesses or default location)
    const businessWithCoords = await Business.findOne({
      $or: [
        { 'businessLocation.coordinates': { $exists: true } },
        { locationId: { $exists: true } }
      ]
    }).populate('locationId', 'coordinates');

    let defaultCenter = { lat: 14.5995, lng: 120.9842 }; // Default to Manila, Philippines
    
    if (businessWithCoords) {
      const coords = businessWithCoords.businessLocation?.coordinates || 
                    businessWithCoords.locationId?.coordinates;
      if (coords) {
        defaultCenter = {
          lat: coords.latitude,
          lng: coords.longitude
        };
      }
    }

    const config = {
      defaultCenter,
      defaultZoom: 12,
      categories,
      mapSettings: {
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: false,
        fullscreenControl: true
      },
      markerSettings: {
        clustererOptions: {
          minimumClusterSize: 2,
          maxZoom: 15
        }
      }
    };

    res.json(config);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update business location coordinates
exports.updateBusinessLocation = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { address, latitude, longitude, placeId, formattedAddress } = req.body;
    const userId = req.user.userId;

    // Check if user owns the business
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (business.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only update your own business location.' });
    }

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    // Update business location
    business.businessLocation = {
      address,
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      placeId,
      formattedAddress
    };

    await business.save();

    res.json({ 
      message: 'Business location updated successfully',
      location: business.businessLocation
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Helper function to calculate distance between two points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
