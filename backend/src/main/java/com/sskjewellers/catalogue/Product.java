package com.sskjewellers.catalogue;

import jakarta.persistence.Column;
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
  @Column(columnDefinition = "TEXT")
  private String image;
  @Column(columnDefinition = "TEXT")
  private String description;
  private boolean featured;
  private boolean tryOnEnabled;
  private String tryOnType;
  @Column(columnDefinition = "TEXT")
  private String tryOnAsset;
  private Double tryOnScale;
  private Double tryOnOffsetY;
  @Column(columnDefinition = "TEXT")
  private String tryOnMask;
  private Integer maskQualityScore;
  private String maskQualityStatus;
  private String jewelleryBBox;
  private String anchorPoints;
  @Column(columnDefinition = "TEXT")
  private String model3dUrl;
  private String model3dStatus;
  @Column(columnDefinition = "TEXT")
  private String model3dError;
  private boolean is3dPublished;
  private Integer model3dQuality;
  private Long model3dGeneratedAt;

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
  public boolean isTryOnEnabled() { return tryOnEnabled; }
  public void setTryOnEnabled(boolean tryOnEnabled) { this.tryOnEnabled = tryOnEnabled; }
  public String getTryOnType() { return tryOnType; }
  public void setTryOnType(String tryOnType) { this.tryOnType = tryOnType; }
  public String getTryOnAsset() { return tryOnAsset; }
  public void setTryOnAsset(String tryOnAsset) { this.tryOnAsset = tryOnAsset; }
  public Double getTryOnScale() { return tryOnScale; }
  public void setTryOnScale(Double tryOnScale) { this.tryOnScale = tryOnScale; }
  public Double getTryOnOffsetY() { return tryOnOffsetY; }
  public void setTryOnOffsetY(Double tryOnOffsetY) { this.tryOnOffsetY = tryOnOffsetY; }
  public String getTryOnMask() { return tryOnMask; }
  public void setTryOnMask(String tryOnMask) { this.tryOnMask = tryOnMask; }
  public Integer getMaskQualityScore() { return maskQualityScore; }
  public void setMaskQualityScore(Integer maskQualityScore) { this.maskQualityScore = maskQualityScore; }
  public String getMaskQualityStatus() { return maskQualityStatus; }
  public void setMaskQualityStatus(String maskQualityStatus) { this.maskQualityStatus = maskQualityStatus; }
  public String getJewelleryBBox() { return jewelleryBBox; }
  public void setJewelleryBBox(String jewelleryBBox) { this.jewelleryBBox = jewelleryBBox; }
  public String getAnchorPoints() { return anchorPoints; }
  public void setAnchorPoints(String anchorPoints) { this.anchorPoints = anchorPoints; }
  public String getModel3dUrl() { return model3dUrl; }
  public void setModel3dUrl(String model3dUrl) { this.model3dUrl = model3dUrl; }
  public String getModel3dStatus() { return model3dStatus; }
  public void setModel3dStatus(String model3dStatus) { this.model3dStatus = model3dStatus; }
  public String getModel3dError() { return model3dError; }
  public void setModel3dError(String model3dError) { this.model3dError = model3dError; }
  public boolean isIs3dPublished() { return is3dPublished; }
  public void setIs3dPublished(boolean is3dPublished) { this.is3dPublished = is3dPublished; }
  public Integer getModel3dQuality() { return model3dQuality; }
  public void setModel3dQuality(Integer model3dQuality) { this.model3dQuality = model3dQuality; }
  public Long getModel3dGeneratedAt() { return model3dGeneratedAt; }
  public void setModel3dGeneratedAt(Long model3dGeneratedAt) { this.model3dGeneratedAt = model3dGeneratedAt; }
}
