package com.sskjewellers.admin;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class ShowroomRates {
  @Id
  private Long id = 1L;
  private double gold22k;
  private double gold24k;
  private double gold18k;
  private double silver;
  private String updatedAt;

  protected ShowroomRates() {}

  public ShowroomRates(double gold22k, double gold24k, double gold18k, double silver, String updatedAt) {
    this.gold22k = gold22k;
    this.gold24k = gold24k;
    this.gold18k = gold18k;
    this.silver = silver;
    this.updatedAt = updatedAt;
  }

  public Long getId() { return id; }
  public double getGold22k() { return gold22k; }
  public void setGold22k(double value) { this.gold22k = value; }
  public double getGold24k() { return gold24k; }
  public void setGold24k(double value) { this.gold24k = value; }
  public double getGold18k() { return gold18k; }
  public void setGold18k(double value) { this.gold18k = value; }
  public double getSilver() { return silver; }
  public void setSilver(double value) { this.silver = value; }
  public String getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(String value) { this.updatedAt = value; }
}
