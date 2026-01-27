"""
Compliance Framework Mapper
===========================
Maps security findings to compliance framework controls.

Supported Frameworks:
- SOC 2 Type II
- PCI-DSS v4.0
- HIPAA
- GDPR
- ISO 27001
- NIST CSF
- CIS Controls v8
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class ComplianceFramework(Enum):
    """Supported compliance frameworks"""
    SOC2 = "soc2"
    PCI_DSS = "pci_dss"
    HIPAA = "hipaa"
    GDPR = "gdpr"
    ISO_27001 = "iso_27001"
    NIST_CSF = "nist_csf"
    CIS_CONTROLS = "cis_controls"


@dataclass
class ComplianceControl:
    """A compliance framework control"""
    framework: str
    control_id: str
    title: str
    description: str
    category: str
    requirement_level: str  # required, recommended, optional


@dataclass
class ComplianceMapping:
    """Mapping of a finding to compliance controls"""
    finding_type: str
    cwe_ids: List[str]
    owasp_categories: List[str]
    controls: Dict[str, List[ComplianceControl]] = field(default_factory=dict)


class ComplianceMapper:
    """
    Maps security findings to compliance framework controls.

    Provides audit-ready compliance reporting for:
    - SOC 2 audits
    - PCI-DSS assessments
    - HIPAA security reviews
    - GDPR compliance checks
    """

    # CWE to Compliance Control Mappings
    CWE_MAPPINGS = {
        # SQL Injection
        "CWE-89": {
            "soc2": ["CC6.1", "CC6.6", "CC7.1", "CC7.2"],
            "pci_dss": ["6.2.4", "6.3.1", "6.5.1"],
            "hipaa": ["164.312(a)(1)", "164.312(a)(2)(iv)"],
            "gdpr": ["Art. 32(1)(b)", "Art. 32(1)(d)"],
            "iso_27001": ["A.14.2.5", "A.14.1.2"],
            "nist_csf": ["PR.DS-2", "PR.DS-5"],
            "cis_controls": ["16.1", "16.11"]
        },
        # Cross-Site Scripting
        "CWE-79": {
            "soc2": ["CC6.1", "CC6.6", "CC7.1"],
            "pci_dss": ["6.2.4", "6.5.7"],
            "hipaa": ["164.312(a)(1)"],
            "gdpr": ["Art. 32(1)(b)"],
            "iso_27001": ["A.14.2.5"],
            "nist_csf": ["PR.DS-5"],
            "cis_controls": ["16.1"]
        },
        # Broken Authentication
        "CWE-287": {
            "soc2": ["CC6.1", "CC6.2", "CC6.3"],
            "pci_dss": ["8.2.1", "8.3.1", "8.3.2", "8.6.1"],
            "hipaa": ["164.312(d)", "164.312(a)(2)(i)"],
            "gdpr": ["Art. 32(1)(b)", "Art. 32(1)(d)"],
            "iso_27001": ["A.9.2.1", "A.9.4.2", "A.9.4.3"],
            "nist_csf": ["PR.AC-1", "PR.AC-7"],
            "cis_controls": ["5.1", "5.2", "6.3"]
        },
        # Sensitive Data Exposure
        "CWE-200": {
            "soc2": ["CC6.1", "CC6.7", "P4.1"],
            "pci_dss": ["3.4.1", "4.2.1", "8.3.1"],
            "hipaa": ["164.312(a)(2)(iv)", "164.312(e)(2)(ii)"],
            "gdpr": ["Art. 32(1)(a)", "Art. 5(1)(f)"],
            "iso_27001": ["A.8.2.3", "A.13.2.3"],
            "nist_csf": ["PR.DS-1", "PR.DS-2"],
            "cis_controls": ["3.10", "3.11"]
        },
        # BOLA/IDOR
        "CWE-639": {
            "soc2": ["CC6.1", "CC6.3", "CC6.6"],
            "pci_dss": ["7.1.1", "7.2.1", "7.3.1"],
            "hipaa": ["164.312(a)(1)", "164.312(a)(2)(i)"],
            "gdpr": ["Art. 32(1)(b)", "Art. 25(2)"],
            "iso_27001": ["A.9.1.1", "A.9.4.1"],
            "nist_csf": ["PR.AC-4", "PR.PT-3"],
            "cis_controls": ["6.1", "6.2"]
        },
        # SSRF
        "CWE-918": {
            "soc2": ["CC6.1", "CC6.6", "CC7.2"],
            "pci_dss": ["6.2.4", "6.5.8"],
            "hipaa": ["164.312(a)(1)"],
            "gdpr": ["Art. 32(1)(b)"],
            "iso_27001": ["A.13.1.1", "A.14.1.2"],
            "nist_csf": ["PR.DS-5", "DE.CM-1"],
            "cis_controls": ["12.1", "13.1"]
        },
        # Security Misconfiguration
        "CWE-16": {
            "soc2": ["CC6.1", "CC6.6", "CC7.1"],
            "pci_dss": ["2.2.1", "6.4.1", "6.4.2"],
            "hipaa": ["164.312(a)(2)(iv)"],
            "gdpr": ["Art. 32(1)(d)"],
            "iso_27001": ["A.12.6.1", "A.14.2.8"],
            "nist_csf": ["PR.IP-1", "PR.IP-2"],
            "cis_controls": ["4.1", "4.2"]
        },
        # Missing Rate Limiting
        "CWE-770": {
            "soc2": ["CC6.1", "CC6.6", "A1.2"],
            "pci_dss": ["6.5.10", "11.4.1"],
            "hipaa": ["164.312(a)(2)(i)"],
            "gdpr": ["Art. 32(1)(b)"],
            "iso_27001": ["A.12.1.3", "A.13.1.2"],
            "nist_csf": ["PR.DS-4", "DE.CM-1"],
            "cis_controls": ["9.2", "13.8"]
        },
        # Cryptographic Failures
        "CWE-327": {
            "soc2": ["CC6.1", "CC6.7"],
            "pci_dss": ["3.6.1", "4.2.1", "4.2.2"],
            "hipaa": ["164.312(a)(2)(iv)", "164.312(e)(2)(ii)"],
            "gdpr": ["Art. 32(1)(a)"],
            "iso_27001": ["A.10.1.1", "A.10.1.2"],
            "nist_csf": ["PR.DS-1", "PR.DS-2"],
            "cis_controls": ["3.10", "3.11"]
        },
        # Path Traversal
        "CWE-22": {
            "soc2": ["CC6.1", "CC6.6"],
            "pci_dss": ["6.2.4", "6.5.8"],
            "hipaa": ["164.312(a)(1)"],
            "gdpr": ["Art. 32(1)(b)"],
            "iso_27001": ["A.14.2.5"],
            "nist_csf": ["PR.DS-5"],
            "cis_controls": ["16.1"]
        },
        # Insufficient Logging
        "CWE-778": {
            "soc2": ["CC7.2", "CC7.3", "CC7.4"],
            "pci_dss": ["10.2.1", "10.3.1", "10.4.1"],
            "hipaa": ["164.312(b)"],
            "gdpr": ["Art. 30", "Art. 33"],
            "iso_27001": ["A.12.4.1", "A.12.4.2"],
            "nist_csf": ["DE.AE-3", "DE.CM-1"],
            "cis_controls": ["8.2", "8.5"]
        }
    }

    # OWASP API Top 10 to Compliance Mappings
    OWASP_MAPPINGS = {
        "API1:2023": {  # Broken Object Level Authorization
            "soc2": ["CC6.1", "CC6.3"],
            "pci_dss": ["7.1.1", "7.2.1"],
            "hipaa": ["164.312(a)(1)"],
            "gdpr": ["Art. 32(1)(b)"]
        },
        "API2:2023": {  # Broken Authentication
            "soc2": ["CC6.1", "CC6.2", "CC6.3"],
            "pci_dss": ["8.2.1", "8.3.1"],
            "hipaa": ["164.312(d)"],
            "gdpr": ["Art. 32(1)(b)"]
        },
        "API3:2023": {  # Broken Object Property Level Authorization
            "soc2": ["CC6.1", "CC6.3"],
            "pci_dss": ["7.1.1"],
            "hipaa": ["164.312(a)(1)"],
            "gdpr": ["Art. 25(2)"]
        },
        "API4:2023": {  # Unrestricted Resource Consumption
            "soc2": ["CC6.1", "A1.2"],
            "pci_dss": ["6.5.10"],
            "hipaa": ["164.312(a)(2)(i)"],
            "gdpr": ["Art. 32(1)(b)"]
        },
        "API5:2023": {  # Broken Function Level Authorization
            "soc2": ["CC6.1", "CC6.3"],
            "pci_dss": ["7.1.1", "7.2.1"],
            "hipaa": ["164.312(a)(1)"],
            "gdpr": ["Art. 32(1)(b)"]
        },
        "API6:2023": {  # Unrestricted Access to Sensitive Business Flows
            "soc2": ["CC6.1", "CC6.6"],
            "pci_dss": ["6.5.10"],
            "hipaa": ["164.312(a)(1)"],
            "gdpr": ["Art. 32(1)(b)"]
        },
        "API7:2023": {  # Server Side Request Forgery
            "soc2": ["CC6.1", "CC6.6"],
            "pci_dss": ["6.5.8"],
            "hipaa": ["164.312(a)(1)"],
            "gdpr": ["Art. 32(1)(b)"]
        },
        "API8:2023": {  # Security Misconfiguration
            "soc2": ["CC6.1", "CC6.6", "CC7.1"],
            "pci_dss": ["2.2.1", "6.4.1"],
            "hipaa": ["164.312(a)(2)(iv)"],
            "gdpr": ["Art. 32(1)(d)"]
        },
        "API9:2023": {  # Improper Inventory Management
            "soc2": ["CC6.1", "CC7.1"],
            "pci_dss": ["2.4", "6.3.2"],
            "hipaa": ["164.312(a)(1)"],
            "gdpr": ["Art. 30"]
        },
        "API10:2023": {  # Unsafe Consumption of APIs
            "soc2": ["CC6.1", "CC9.2"],
            "pci_dss": ["6.4.3", "12.8.1"],
            "hipaa": ["164.314(a)(2)(i)"],
            "gdpr": ["Art. 28"]
        }
    }

    # Control Details
    CONTROL_DETAILS = {
        "soc2": {
            "CC6.1": ComplianceControl(
                framework="SOC 2",
                control_id="CC6.1",
                title="Logical and Physical Access Controls",
                description="The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity's objectives.",
                category="Common Criteria",
                requirement_level="required"
            ),
            "CC6.2": ComplianceControl(
                framework="SOC 2",
                control_id="CC6.2",
                title="Authentication Controls",
                description="Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.",
                category="Common Criteria",
                requirement_level="required"
            ),
            "CC6.3": ComplianceControl(
                framework="SOC 2",
                control_id="CC6.3",
                title="Authorization Controls",
                description="The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles.",
                category="Common Criteria",
                requirement_level="required"
            ),
            "CC6.6": ComplianceControl(
                framework="SOC 2",
                control_id="CC6.6",
                title="Security Measures Against Threats",
                description="The entity implements logical access security measures to protect against threats from sources outside its system boundaries.",
                category="Common Criteria",
                requirement_level="required"
            ),
            "CC6.7": ComplianceControl(
                framework="SOC 2",
                control_id="CC6.7",
                title="Data Transmission Security",
                description="The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes.",
                category="Common Criteria",
                requirement_level="required"
            ),
            "CC7.1": ComplianceControl(
                framework="SOC 2",
                control_id="CC7.1",
                title="Vulnerability Detection",
                description="To meet its objectives, the entity uses detection and monitoring procedures to identify changes to configurations that result in the introduction of new vulnerabilities.",
                category="Common Criteria",
                requirement_level="required"
            ),
            "CC7.2": ComplianceControl(
                framework="SOC 2",
                control_id="CC7.2",
                title="Security Event Monitoring",
                description="The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts.",
                category="Common Criteria",
                requirement_level="required"
            ),
        },
        "pci_dss": {
            "6.2.4": ComplianceControl(
                framework="PCI-DSS v4.0",
                control_id="6.2.4",
                title="Secure Coding Techniques",
                description="Software engineering techniques or other methods are defined and in use by software development personnel to prevent or mitigate common software attacks.",
                category="Requirement 6",
                requirement_level="required"
            ),
            "6.5.1": ComplianceControl(
                framework="PCI-DSS v4.0",
                control_id="6.5.1",
                title="Injection Flaws",
                description="Injection flaws, particularly SQL injection, are addressed in development processes.",
                category="Requirement 6",
                requirement_level="required"
            ),
            "8.3.1": ComplianceControl(
                framework="PCI-DSS v4.0",
                control_id="8.3.1",
                title="Strong Authentication",
                description="All user access to system components is authenticated via strong authentication.",
                category="Requirement 8",
                requirement_level="required"
            ),
        },
        "hipaa": {
            "164.312(a)(1)": ComplianceControl(
                framework="HIPAA",
                control_id="164.312(a)(1)",
                title="Access Control",
                description="Implement technical policies and procedures for electronic information systems that maintain ePHI to allow access only to authorized persons or software programs.",
                category="Technical Safeguards",
                requirement_level="required"
            ),
            "164.312(d)": ComplianceControl(
                framework="HIPAA",
                control_id="164.312(d)",
                title="Person or Entity Authentication",
                description="Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed.",
                category="Technical Safeguards",
                requirement_level="required"
            ),
        },
        "gdpr": {
            "Art. 32(1)(b)": ComplianceControl(
                framework="GDPR",
                control_id="Art. 32(1)(b)",
                title="Security of Processing",
                description="The ability to ensure the ongoing confidentiality, integrity, availability and resilience of processing systems and services.",
                category="Article 32",
                requirement_level="required"
            ),
            "Art. 32(1)(d)": ComplianceControl(
                framework="GDPR",
                control_id="Art. 32(1)(d)",
                title="Security Testing",
                description="A process for regularly testing, assessing and evaluating the effectiveness of technical and organizational measures.",
                category="Article 32",
                requirement_level="required"
            ),
        }
    }

    def __init__(self):
        self.enabled_frameworks = list(ComplianceFramework)

    def set_enabled_frameworks(self, frameworks: List[ComplianceFramework]):
        """Set which compliance frameworks to include in mappings"""
        self.enabled_frameworks = frameworks

    def map_finding(self, finding: Any) -> Dict[str, List[str]]:
        """
        Map a security finding to compliance controls.

        Args:
            finding: Finding object with cwe_id and owasp_category

        Returns:
            Dict mapping framework names to list of control IDs
        """
        mappings: Dict[str, List[str]] = {}

        # Map by CWE ID
        if finding.cwe_id:
            cwe_clean = finding.cwe_id.replace("CWE-", "")
            cwe_key = f"CWE-{cwe_clean}"

            if cwe_key in self.CWE_MAPPINGS:
                for framework, controls in self.CWE_MAPPINGS[cwe_key].items():
                    if any(f.value == framework for f in self.enabled_frameworks):
                        if framework not in mappings:
                            mappings[framework] = []
                        mappings[framework].extend(controls)

        # Map by OWASP category
        if finding.owasp_category:
            owasp_id = finding.owasp_category.split(" - ")[0] if " - " in finding.owasp_category else finding.owasp_category

            if owasp_id in self.OWASP_MAPPINGS:
                for framework, controls in self.OWASP_MAPPINGS[owasp_id].items():
                    if any(f.value == framework for f in self.enabled_frameworks):
                        if framework not in mappings:
                            mappings[framework] = []
                        mappings[framework].extend(controls)

        # Deduplicate
        for framework in mappings:
            mappings[framework] = list(set(mappings[framework]))

        return mappings

    def get_control_details(self, framework: str, control_id: str) -> Optional[ComplianceControl]:
        """Get detailed information about a compliance control"""
        framework_controls = self.CONTROL_DETAILS.get(framework, {})
        return framework_controls.get(control_id)

    def get_summary(self, findings: List[Any]) -> Dict[str, Any]:
        """
        Generate compliance summary for all findings.

        Returns summary showing which controls are affected.
        """
        summary = {
            "frameworks": {},
            "total_controls_affected": 0,
            "controls_by_framework": {}
        }

        all_controls: Dict[str, set] = {}

        for finding in findings:
            mappings = self.map_finding(finding)
            for framework, controls in mappings.items():
                if framework not in all_controls:
                    all_controls[framework] = set()
                all_controls[framework].update(controls)

        for framework, controls in all_controls.items():
            control_list = sorted(list(controls))
            summary["controls_by_framework"][framework] = control_list
            summary["frameworks"][framework] = {
                "controls_affected": len(control_list),
                "controls": control_list,
                "status": "REQUIRES_ATTENTION" if control_list else "COMPLIANT"
            }

        summary["total_controls_affected"] = sum(
            len(controls) for controls in all_controls.values()
        )

        return summary

    def generate_audit_report(self, findings: List[Any], framework: ComplianceFramework) -> Dict[str, Any]:
        """
        Generate a detailed audit report for a specific framework.

        Suitable for auditor review.
        """
        framework_key = framework.value
        affected_controls: Dict[str, List[Any]] = {}

        for finding in findings:
            mappings = self.map_finding(finding)
            if framework_key in mappings:
                for control_id in mappings[framework_key]:
                    if control_id not in affected_controls:
                        affected_controls[control_id] = []
                    affected_controls[control_id].append({
                        "finding_id": finding.id,
                        "type": finding.type,
                        "severity": finding.severity,
                        "endpoint": finding.endpoint,
                        "description": finding.description
                    })

        report = {
            "framework": framework.value,
            "framework_name": self._get_framework_name(framework),
            "generated_at": None,  # Will be set by caller
            "total_findings": len(findings),
            "controls_affected": len(affected_controls),
            "control_details": []
        }

        for control_id, control_findings in affected_controls.items():
            control_info = self.get_control_details(framework_key, control_id)
            report["control_details"].append({
                "control_id": control_id,
                "title": control_info.title if control_info else control_id,
                "description": control_info.description if control_info else "",
                "requirement_level": control_info.requirement_level if control_info else "required",
                "findings_count": len(control_findings),
                "findings": control_findings,
                "status": "NON_COMPLIANT",
                "remediation_required": True
            })

        return report

    def _get_framework_name(self, framework: ComplianceFramework) -> str:
        """Get human-readable framework name"""
        names = {
            ComplianceFramework.SOC2: "SOC 2 Type II",
            ComplianceFramework.PCI_DSS: "PCI-DSS v4.0",
            ComplianceFramework.HIPAA: "HIPAA Security Rule",
            ComplianceFramework.GDPR: "GDPR",
            ComplianceFramework.ISO_27001: "ISO 27001:2022",
            ComplianceFramework.NIST_CSF: "NIST Cybersecurity Framework",
            ComplianceFramework.CIS_CONTROLS: "CIS Controls v8"
        }
        return names.get(framework, framework.value)
