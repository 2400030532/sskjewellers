package com.sskjewellers.catalogue;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "catalogue_products")
public class Product {
  @Id
  private String id;
  private String sku;
  private String name;
  private String teluguName;
  private String category;
  private String metal;
  private String purity;
  private double approxGrossWeight;
  private double approxNetWeight;
  private double price;
  private String stoneDetails;
  private String availability;
  private String availabilityText;
  private String leadTime;
  private String badge;
  private String image;
  private String description;
  private boolean featured;

  protected Product() {}

  public Product(String id, String sku, String name, String teluguName, String category, String metal, String purity,
      double approxGrossWeight, double approxNetWeight, String stoneDetails, String availability, String availabilityText,
      String leadTime, String badge, String image, String description, boolean featured, double price) {
    this.id = id;
    this.sku = sku;
    this.name = name;
    this.teluguName = teluguName;
    this.category = category;
    this.metal = metal;
    this.purity = purity;
    this.approxGrossWeight = approxGrossWeight;
    this.approxNetWeight = approxNetWeight;
    this.price = price;
    this.stoneDetails = stoneDetails;
    this.availability = availability;
    this.availabilityText = availabilityText;
    this.leadTime = leadTime;
    this.badge = badge;
    this.image = image;
    this.description = description;
    this.featured = featured;
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getSku() { return sku; }
  public void setSku(String sku) { this.sku = sku; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getTeluguName() { return teluguName; }
  public void setTeluguName(String teluguName) { this.teluguName = teluguName; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public String getMetal() { return metal; }
  public void setMetal(String metal) { this.metal = metal; }
  public String getPurity() { return purity; }
  public void setPurity(String purity) { this.purity = purity; }
  public double getApproxGrossWeight() { return approxGrossWeight; }
  public void setApproxGrossWeight(double value) { this.approxGrossWeight = value; }
  public double getApproxNetWeight() { return approxNetWeight; }
  public void setApproxNetWeight(double value) { this.approxNetWeight = value; }
  public double getPrice() { return price; }
  public void setPrice(double price) { this.price = price; }
  public String getStoneDetails() { return stoneDetails; }
  public void setStoneDetails(String stoneDetails) { this.stoneDetails = stoneDetails; }
  public String getAvailability() { return availability; }
  public void setAvailability(String availability) { this.availability = availability; }
  public String getAvailabilityText() { return availabilityText; }
  public void setAvailabilityText(String availabilityText) { this.availabilityText = availabilityText; }
  public String getLeadTime() { return leadTime; }
  public void setLeadTime(String leadTime) { this.leadTime = leadTime; }
  public String getBadge() { return badge; }
  public void setBadge(String badge) { this.badge = badge; }
  public String getImage() { return image; }
  public void setImage(String image) { this.image = image; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public boolean isFeatured() { return featured; }
  public void setFeatured(boolean featured) { this.featured = featured; }
}
