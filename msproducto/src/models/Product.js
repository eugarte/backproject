class Product {
    constructor(data) {
        this.id = data.id;
        this.sku = data.sku;
        this.name = data.name;
        this.slug = data.slug;
        this.categoryId = data.category_id;
        this.brand = data.brand;
        this.price = parseFloat(data.price);
        this.compareAtPrice = data.compare_at_price ? parseFloat(data.compare_at_price) : null;
        this.costPrice = data.cost_price ? parseFloat(data.cost_price) : null;
        this.currency = data.currency || 'USD';
        this.stock = data.stock;
        this.stockAlertLevel = data.stock_alert_level;
        this.trackInventory = data.track_inventory === 1;
        
        this.attributes = this.parseJson(data.attributes);
        
        this.shortDescription = data.short_description;
        this.description = data.description;
        this.metaTitle = data.meta_title;
        this.metaDescription = data.meta_description;
        
        this.status = data.status;
        this.isFeatured = data.is_featured === 1;
        
        this.viewCount = data.view_count;
        this.salesCount = data.sales_count;
        this.rating = parseFloat(data.rating);
        this.reviewCount = data.review_count;
        
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
        
        this.category = null;
        this.images = [];
        this.variants = [];
        this.reviews = [];
    }

    parseJson(json) {
        if (!json) return {};
        if (typeof json === 'string') {
            try {
                return JSON.parse(json);
            } catch {
                return {};
            }
        }
        return json;
    }

    getAttribute(key, defaultValue = null) {
        return this.attributes[key] ?? defaultValue;
    }

    toJSON() {
        return {
            id: this.id,
            sku: this.sku,
            name: this.name,
            slug: this.slug,
            category: this.category,
            brand: this.brand,
            pricing: {
                price: this.price,
                compareAtPrice: this.compareAtPrice,
                costPrice: this.costPrice,
                currency: this.currency
            },
            stock: {
                quantity: this.stock,
                alertLevel: this.stockAlertLevel,
                trackInventory: this.trackInventory
            },
            attributes: this.attributes,
            content: {
                shortDescription: this.shortDescription,
                description: this.description,
                metaTitle: this.metaTitle,
                metaDescription: this.metaDescription
            },
            status: this.status,
            isFeatured: this.isFeatured,
            metrics: {
                views: this.viewCount,
                sales: this.salesCount,
                rating: this.rating,
                reviews: this.reviewCount
            },
            images: this.images,
            variants: this.variants,
            reviews: this.reviews,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Product;