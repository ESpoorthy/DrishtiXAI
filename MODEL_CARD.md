# Model Card: DrishtiXAI DR Classifier

## Model Details

**Model Name**: DrishtiXAI Diabetic Retinopathy Classifier  
**Version**: v1.0.0-demo (Prototype)  
**Date**: January 2026  
**Organization**: [Your Team/Organization]  
**Contact**: [your-email@example.com]

### Model Description

A deep learning model for automated diabetic retinopathy (DR) severity classification from retinal fundus images, designed for screening decision support in resource-limited settings.

- **Architecture**: EfficientNet-B0
- **Task**: Multi-class image classification
- **Input**: RGB fundus images, 224×224 pixels
- **Output**: DR severity level (0-4) with confidence scores
- **Framework**: PyTorch 2.1.1

### Model Classes

| Class | Label | Description |
|-------|-------|-------------|
| 0 | No DR | No diabetic retinopathy detected |
| 1 | Mild NPDR | Mild non-proliferative diabetic retinopathy |
| 2 | Moderate NPDR | Moderate non-proliferative diabetic retinopathy |
| 3 | Severe NPDR | Severe non-proliferative diabetic retinopathy |
| 4 | Proliferative DR | Proliferative diabetic retinopathy |

---

## Intended Use

### Primary Intended Uses

- **Screening decision support** in community health centers
- **Referral prioritization** for ophthalmologist review
- **Risk stratification** for diabetic patients
- **Quality control** for retinal image capture

### Intended Users

- **Community health workers** with basic training in fundus photography
- **General practitioners** in primary care settings
- **Ophthalmologists** for preliminary triage
- **Screening program coordinators**

### Out-of-Scope Uses

❌ **NOT intended for**:

- Autonomous diagnosis without clinician review
- Treatment planning or clinical decision-making
- Replace comprehensive ophthalmological examination
- Medicolegal documentation
- Insurance claim adjudication
- Population not represented in training data

---

## Training Data

### Current Status

⚠️ **DEMO MODE**: The current deployment uses synthetic predictions for demonstration purposes. A production-ready model requires training on a validated dataset.

### Recommended Training Dataset Requirements

**Minimum Requirements**:
- 10,000+ labeled fundus images
- Images from multiple camera types
- Diverse patient demographics
- Expert ophthalmologist annotations
- Multiple graders for quality control

**Recommended Public Datasets**:

1. **Kaggle Diabetic Retinopathy Detection**
   - 35,000+ high-resolution images
   - 5-level severity grading
   - Clinician-reviewed labels

2. **APTOS 2019 Blindness Detection**
   - 3,662 fundus images
   - Rural India focus
   - Variable image quality

3. **Messidor-2**
   - 1,748 images
   - Expert ophthalmologist grading
   - Well-documented protocol

4. **EyePACS**
   - Large-scale dataset
   - Real-world screening conditions
   - Diverse patient population

### Data Preprocessing

```python
# Standard preprocessing pipeline
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])
```

### Data Splits

- **Training**: 70% (with class balancing)
- **Validation**: 15%
- **Test**: 15%

**Important**: Patient-level split to prevent data leakage (same patient images should not appear in multiple splits).

---

## Evaluation

### Performance Metrics

The model should be evaluated using:

**Classification Metrics**:
- Accuracy
- Precision, Recall, F1-score (per class)
- Cohen's Kappa (inter-rater agreement)
- Quadratic Weighted Kappa (ordinal classes)

**Clinical Metrics**:
- **Sensitivity** (recall for DR positive): Critical for screening
- **Specificity**: Reduce false positives
- **ROC-AUC**: Overall discriminative ability
- **Referral accuracy**: Correct priority assignment

**Calibration**:
- Reliability diagrams
- Expected Calibration Error (ECE)
- Confidence distribution analysis

### Target Performance

⚠️ **Note**: These are suggested targets. Actual performance depends on training data quality and deployment environment.

| Metric | Target | Rationale |
|--------|--------|-----------|
| Sensitivity (any DR) | ≥90% | Minimize false negatives |
| Specificity | ≥85% | Reduce unnecessary referrals |
| Quadratic Kappa | ≥0.85 | Strong agreement with experts |
| Calibration ECE | <0.10 | Reliable confidence scores |

### Evaluation Data

**Test Set Requirements**:
- Representative of target population
- Independent from training data
- Expert-labeled ground truth
- Multiple camera types
- Real-world image quality distribution

---

## Limitations

### Technical Limitations

1. **Image Quality Dependency**
   - Performance degrades with poor-quality images
   - Requires adequate illumination and focus
   - Sensitive to camera characteristics

2. **Training Data Constraints**
   - Limited to severity levels present in training
   - May not generalize to underrepresented demographics
   - Performance varies with image acquisition device

3. **Computational Requirements**
   - Requires GPU for reasonable inference speed
   - ~2-5 seconds per image on consumer GPU
   - Not suitable for real-time video analysis

### Clinical Limitations

1. **Not a Diagnostic Tool**
   - Provides screening decision support only
   - Cannot replace comprehensive eye examination
   - Does not detect all eye pathologies

2. **False Negatives**
   - May miss subtle early-stage DR
   - Cannot detect DR in poor-quality images
   - Limited by training data representation

3. **False Positives**
   - May flag non-DR abnormalities
   - Can be triggered by image artifacts
   - Leads to unnecessary referrals if not reviewed

### Deployment Limitations

1. **Geographic Generalization**
   - Performance may vary across populations
   - Different DR prevalence affects predictive value
   - Local validation required

2. **Infrastructure Requirements**
   - Requires reliable power supply
   - Internet connectivity for cloud deployment
   - Trained personnel for image capture

---

## Fairness and Bias

### Potential Sources of Bias

1. **Demographic Bias**
   - Underrepresentation of certain age groups
   - Ethnic/racial composition of training data
   - Gender imbalance in dataset

2. **Geographic Bias**
   - Training data predominantly from specific regions
   - Different DR progression patterns
   - Varying healthcare access affecting disease stage distribution

3. **Technical Bias**
   - Camera equipment differences
   - Image quality variations
   - Annotation inconsistencies

### Fairness Evaluation Requirements

Before deployment, evaluate performance across:

- **Age groups**: <40, 40-60, >60 years
- **Gender**: Male, Female, Other
- **Image quality**: Good, Acceptable
- **Camera type**: Different acquisition devices
- **Geographic region**: Different screening sites

### Mitigation Strategies

1. **Balanced Training Data**
   - Ensure representative sampling
   - Oversample underrepresented groups
   - Data augmentation for minority classes

2. **Fairness Constraints**
   - Equalized odds across groups
   - Demographic parity where appropriate
   - Minimize disparate impact

3. **Continuous Monitoring**
   - Track performance by subgroup
   - Regular model retraining
   - Feedback loop from deployment

---

## Ethical Considerations

### Patient Privacy

- Patient data must be handled per HIPAA/local regulations
- Images should be de-identified before processing
- Secure storage and transmission required
- Patient consent for AI-assisted screening

### Clinical Responsibility

- **Human oversight mandatory**: All AI predictions require clinician review
- **Liability**: Healthcare provider retains full responsibility
- **Informed consent**: Patients informed about AI use
- **Right to opt-out**: Patients can refuse AI screening

### Transparency

- Patients informed when AI is involved
- Explanation of AI role in decision-making
- Clear communication of limitations
- Model version and confidence shown to clinicians

### Access and Equity

- **Goal**: Improve access in underserved areas
- **Risk**: May widen gap if infrastructure lacking
- **Mitigation**: Offline-capable, low-resource design
- **Monitoring**: Track deployment equity metrics

---

## Regulatory Status

### Current Status

⚠️ **NOT APPROVED FOR CLINICAL USE**

This is a **research prototype** that has not been:
- Cleared by FDA or equivalent regulatory bodies
- Validated in clinical trials
- Certified as a medical device

### Required for Clinical Deployment

1. **Clinical Validation**
   - Prospective clinical study
   - Comparison with current standard of care
   - Multi-site validation
   - Published in peer-reviewed journal

2. **Regulatory Approval**
   - FDA 510(k) clearance (USA)
   - CE marking (Europe)
   - CDSCO approval (India)
   - Local regulatory compliance

3. **Quality Management**
   - ISO 13485 certification
   - Risk management (ISO 14971)
   - Software lifecycle processes
   - Post-market surveillance plan

---

## Model Explainability

### Grad-CAM Visual Explanations

The model uses Gradient-weighted Class Activation Mapping (Grad-CAM) to highlight regions that influenced the prediction.

**Interpretation**:
- **Red/Yellow regions**: High model attention
- **Blue/Green regions**: Lower model attention
- **Transparency**: Shows original image features

**Important Notes**:
- Heatmaps show **model attention**, not clinical lesions
- High attention does not prove abnormality exists
- Should be interpreted by trained clinicians
- Useful for trust calibration and error analysis

### Confidence Scores

Each prediction includes a confidence score (0-100%):

- **High (80-100%)**: Strong model certainty
- **Medium (60-80%)**: Moderate certainty
- **Low (<60%)**: Uncertain - requires human review

**Calibration**: Confidence scores should be calibrated so that 80% confidence means approximately 80% accuracy across many predictions.

---

## Model Maintenance

### Monitoring Requirements

**Performance Monitoring**:
- Track prediction distribution over time
- Monitor confidence score distribution
- Measure clinician agreement rate
- Identify performance degradation

**Data Drift Detection**:
- Compare input image statistics
- Monitor quality metric distribution
- Track referral rate changes
- Identify population shifts

### Retraining Triggers

Consider model retraining when:
- Clinician agreement rate drops below threshold
- Significant data drift detected
- New camera equipment introduced
- Expanded to new geographic region
- Updated clinical guidelines

### Version Control

- Maintain model version with each deployment
- Track which predictions made by which version
- Enable rollback to previous versions
- Document changes between versions

---

## References

### Key Publications

1. Gulshan, V., et al. (2016). "Development and Validation of a Deep Learning Algorithm for Detection of Diabetic Retinopathy in Retinal Fundus Photographs." *JAMA*, 316(22), 2402-2410.

2. Ting, D.S.W., et al. (2017). "Development and Validation of a Deep Learning System for Diabetic Retinopathy and Related Eye Diseases Using Retinal Images from Multiethnic Populations with Diabetes." *JAMA*, 318(22), 2211-2223.

3. Selvaraju, R.R., et al. (2017). "Grad-CAM: Visual Explanations from Deep Networks via Gradient-based Localization." *ICCV*.

### Clinical Guidelines

- International Council of Ophthalmology (ICO) Guidelines for Diabetic Eye Care
- American Diabetes Association Standards of Medical Care
- WHO Guidelines for Screening for Diabetic Retinopathy

---

## Updates and Versioning

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0-demo | Jan 2026 | Initial prototype (demo mode) |

---

## Contact

For questions about this model:
- **Technical**: [tech-contact@example.com]
- **Clinical**: [clinical-contact@example.com]
- **Regulatory**: [regulatory-contact@example.com]

---

## Acknowledgments

- Smart India Hackathon 2026
- MathWorks (Problem statement organization)
- Open-source ML community
- Clinical advisors and domain experts

---

**Last Updated**: January 2026  
**Document Version**: 1.0
