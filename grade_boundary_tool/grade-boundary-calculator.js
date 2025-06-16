// Grade Boundary Calculator - Standalone JavaScript Implementation
class GradeBoundaryCalculator {
    constructor() {
        this.totalMarks = 100;
        this.calculationMode = 'generic';
        this.studentScores = [];
        this.gradeBoundaries = [];
        
        // GCSE grading standard (0-9)
        this.gradingStandard = {
            name: "GCSE Grades",
            grades: [
                { numerical: 9, letter: "9", description: "Exceptional", targetPercentile: 95 },
                { numerical: 8, letter: "8", description: "Excellent", targetPercentile: 88 },
                { numerical: 7, letter: "7", description: "Very Good", targetPercentile: 78 },
                { numerical: 6, letter: "6", description: "Good", targetPercentile: 65 },
                { numerical: 5, letter: "5", description: "Strong Pass", targetPercentile: 50 },
                { numerical: 4, letter: "4", description: "Standard Pass", targetPercentile: 35 },
                { numerical: 3, letter: "3", description: "Grade 3", targetPercentile: 22 },
                { numerical: 2, letter: "2", description: "Grade 2", targetPercentile: 12 },
                { numerical: 1, letter: "1", description: "Grade 1", targetPercentile: 5 },
                { numerical: 0, letter: "U", description: "Ungraded", targetPercentile: 0 }
            ]
        };
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Total marks input
        const totalMarksInput = document.getElementById('totalMarks');
        if (totalMarksInput) {
            totalMarksInput.addEventListener('input', (e) => {
                this.totalMarks = parseInt(e.target.value) || 100;
                this.updateTotalMarksDisplay();
                if (this.gradeBoundaries.length > 0) {
                    this.calculateBoundaries();
                }
            });
        }
        
        // Score input validation
        const scoreInput = document.getElementById('scoreInput');
        if (scoreInput) {
            scoreInput.addEventListener('input', () => {
                this.validateInput();
            });
        }
    }
    
    validateInput() {
        const scoreInput = document.getElementById('scoreInput');
        const piiWarning = document.getElementById('pii-warning');
        const addButton = document.getElementById('add-scores-btn');
        
        if (!scoreInput || !piiWarning || !addButton) return;
        
        const text = scoreInput.value;
        const warnings = this.validatePII(text);
        
        if (warnings.length > 0) {
            piiWarning.classList.remove('hidden');
            addButton.disabled = true;
            addButton.textContent = 'Fix Input Format';
            addButton.className = addButton.className.replace('bg-green-600 hover:bg-green-700', 'bg-gray-400 cursor-not-allowed');
            scoreInput.className = scoreInput.className + ' border-red-500 bg-red-50';
        } else {
            piiWarning.classList.add('hidden');
            addButton.disabled = false;
            addButton.innerHTML = '<i data-lucide="upload" class="mr-1" style="width: 14px; height: 14px;"></i>Add Scores';
            addButton.className = addButton.className.replace('bg-gray-400 cursor-not-allowed', 'bg-green-600 hover:bg-green-700');
            scoreInput.className = scoreInput.className.replace(' border-red-500 bg-red-50', '');
        }
        
        // Re-initialize icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    
    validatePII(text) {
        const warnings = [];
        
        // Only check for obvious personal information patterns
        const piiPatterns = [
            { pattern: /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, message: "Email addresses detected" },
            { pattern: /\b[A-Za-z]+\s+[A-Za-z]+\s+\d+\b/, message: "Name with score pattern detected" },
        ];
        
        // Only check for very common names when they appear with non-numeric context
        const obviousNamePatterns = [
            /\b(john|jane|smith|jones|williams|brown|davis|miller|wilson|moore|taylor|anderson|thomas|jackson|white|harris|martin|thompson|garcia|martinez|robinson|clark|rodriguez|lewis|lee|walker|hall|allen|young|hernandez|king|wright|lopez|hill|scott|green|adams|baker|gonzalez|nelson|carter|mitchell|perez|roberts|turner|phillips|campbell|parker|evans|edwards|collins|stewart|sanchez|morris|rogers|reed|cook|morgan|bell|murphy|bailey|rivera|cooper|richardson|cox|howard|ward|torres|peterson|gray|ramirez|james|watson|brooks|kelly|sanders|price|bennett|wood|barnes|ross|henderson|coleman|jenkins|perry|powell|long|patterson|hughes|flores|washington|butler|simmons|foster|gonzales|bryant|alexander|russell|griffin|diaz|hayes)\b/i
        ];
        
        piiPatterns.forEach(({ pattern, message }) => {
            if (pattern.test(text)) {
                warnings.push(message);
            }
        });
        
        // Only flag obvious names if they appear in non-numeric context
        obviousNamePatterns.forEach(pattern => {
            if (pattern.test(text)) {
                warnings.push("Potential name detected - only enter numerical scores");
            }
        });
        
        return warnings;
    }
    
    calculateDataDrivenBoundaries(studentScores, totalMarks) {
        if (studentScores.length === 0) {
            throw new Error("No student scores provided");
        }
        
        const sortedScores = studentScores
            .map(s => s.score)
            .sort((a, b) => b - a); // Descending order
        
        const boundaries = [];
        
        for (let i = 0; i < this.gradingStandard.grades.length; i++) {
            const grade = this.gradingStandard.grades[i];
            
            // Calculate boundary based on percentile from top
            const percentileFromBottom = (100 - grade.targetPercentile) / 100;
            const percentileIndex = Math.floor(percentileFromBottom * sortedScores.length);
            const minScore = percentileIndex < sortedScores.length ? sortedScores[percentileIndex] : 0;
            
            // Max score is one less than the previous grade's min score, or totalMarks for the highest grade
            const maxScore = i === 0 ? totalMarks : 
                            (boundaries[i - 1]?.minScore - 1) || totalMarks;
            
            // Ensure max >= min
            const finalMaxScore = Math.max(minScore, maxScore);
            
            // Count students in this grade range
            const studentsInGrade = sortedScores.filter(score => 
                score >= minScore && score <= finalMaxScore
            ).length;
            
            boundaries.push({
                numericalGrade: grade.numerical,
                letterGrade: grade.letter,
                minScore: Math.max(0, minScore),
                maxScore: Math.max(0, finalMaxScore),
                percentage: Math.round((minScore / totalMarks) * 100),
                description: grade.description,
                studentsInGrade
            });
        }
        
        return boundaries.filter(b => b.maxScore >= b.minScore);
    }
    
    calculateGenericBoundaries(totalMarks) {
        const boundaries = [];
        
        for (let i = 0; i < this.gradingStandard.grades.length; i++) {
            const grade = this.gradingStandard.grades[i];
            const nextGrade = this.gradingStandard.grades[i + 1];
            
            // Calculate min score based on target percentile
            const minScore = Math.round((grade.targetPercentile / 100) * totalMarks);
            
            // Max score is one less than the previous grade's min score, or totalMarks for the highest grade
            const maxScore = i === 0 ? totalMarks : 
                            (boundaries[i - 1]?.minScore - 1) || totalMarks;
            
            // Ensure max >= min
            const finalMaxScore = Math.max(minScore, maxScore);
            
            boundaries.push({
                numericalGrade: grade.numerical,
                letterGrade: grade.letter,
                minScore: Math.max(0, minScore),
                maxScore: Math.max(0, finalMaxScore),
                percentage: Math.round((minScore / totalMarks) * 100),
                description: grade.description
            });
        }
        
        return boundaries.filter(b => b.maxScore >= b.minScore);
    }
    
    calculateBoundaries() {
        try {
            let boundaries;
            
            if (this.calculationMode === "data_driven" && this.studentScores.length > 0) {
                boundaries = this.calculateDataDrivenBoundaries(this.studentScores, this.totalMarks);
            } else {
                boundaries = this.calculateGenericBoundaries(this.totalMarks);
            }
            
            this.gradeBoundaries = boundaries;
            this.updateBoundariesTable();
            this.updateStatistics();
        } catch (error) {
            console.error("Calculation error:", error);
            this.showNotification("Calculation Error: " + error.message, "error");
        }
    }
    
    updateBoundariesTable() {
        const tableBody = document.getElementById('boundaries-table');
        const studentsHeader = document.getElementById('students-header');
        
        if (!tableBody) return;
        
        // Show/hide students column based on calculation mode
        if (studentsHeader) {
            if (this.calculationMode === 'data_driven') {
                studentsHeader.classList.remove('hidden');
            } else {
                studentsHeader.classList.add('hidden');
            }
        }
        
        if (this.gradeBoundaries.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${this.calculationMode === 'data_driven' ? 5 : 4}" class="py-8 text-center text-neutral-grey">
                        Click "Calculate Boundaries" to generate grade thresholds
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = this.gradeBoundaries.map(boundary => `
            <tr class="grade-boundary-row">
                <td class="py-4 px-4">
                    <span class="px-2 py-1 text-xs font-medium rounded ${this.getGradeColor(boundary.letterGrade)}">
                        ${boundary.letterGrade}
                    </span>
                </td>
                <td class="py-4 px-4">
                    <span class="text-sm font-medium text-slate-900">
                        ${boundary.minScore} - ${boundary.maxScore}
                    </span>
                </td>
                <td class="py-4 px-4">
                    <div class="flex items-center space-x-2">
                        <div class="flex-1 bg-gray-200 rounded-full h-2 max-w-20">
                            <div
                                class="h-2 rounded-full progress-bar ${this.getProgressColor(boundary.letterGrade)}"
                                style="width: ${Math.min(boundary.percentage, 100)}%"
                            ></div>
                        </div>
                        <span class="text-sm text-neutral-grey">${boundary.percentage}%+</span>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <span class="text-sm text-neutral-grey">${boundary.description}</span>
                </td>
                ${this.calculationMode === 'data_driven' ? `
                    <td class="py-4 px-4">
                        <span class="text-sm font-medium text-slate-900">
                            ${boundary.studentsInGrade || 0}
                        </span>
                    </td>
                ` : ''}
            </tr>
        `).join('');
    }
    
    updateStatistics() {
        const statsContent = document.getElementById('statistics-content');
        if (!statsContent) return;
        
        let stats;
        
        if (this.calculationMode === 'data_driven' && this.studentScores.length > 0) {
            stats = this.calculateDataDrivenStats();
            statsContent.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-grey">Total Students</span>
                    <span class="text-sm font-medium text-slate-900">${stats.totalStudents}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-grey">Mean Score</span>
                    <span class="text-sm font-medium text-slate-900">${stats.meanScore}/${this.totalMarks}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-grey">Median Score</span>
                    <span class="text-sm font-medium text-slate-900">${stats.medianScore}/${this.totalMarks}</span>
                </div>
            `;
        } else {
            stats = this.calculateGenericStats();
            statsContent.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-grey">Pass Rate</span>
                    <span class="text-sm font-medium text-slate-900">${stats.passRate}%</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-grey">High Achievers</span>
                    <span class="text-sm font-medium text-slate-900">${stats.highAchievers}%</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-neutral-grey">Top Grades</span>
                    <span class="text-sm font-medium text-slate-900">${stats.topGrades}%</span>
                </div>
            `;
        }
    }
    
    calculateDataDrivenStats() {
        const scores = this.studentScores.map(s => s.score);
        const sortedScores = [...scores].sort((a, b) => a - b);
        
        const meanScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
        
        return {
            totalStudents: scores.length,
            meanScore,
            medianScore,
            passRate: Math.round((scores.filter(s => s >= this.getBoundaryForGrade('4')).length / scores.length) * 100),
            highAchievers: Math.round((scores.filter(s => s >= this.getBoundaryForGrade('7')).length / scores.length) * 100),
            topGrades: Math.round((scores.filter(s => s >= this.getBoundaryForGrade('8')).length / scores.length) * 100)
        };
    }
    
    calculateGenericStats() {
        return {
            passRate: 65, // Typical GCSE pass rate (grade 4+)
            highAchievers: 22, // Typical grade 7+ rate
            topGrades: 12 // Typical grade 8+ rate
        };
    }
    
    getBoundaryForGrade(grade) {
        const boundary = this.gradeBoundaries.find(b => b.letterGrade === grade);
        return boundary ? boundary.minScore : 0;
    }
    
    getGradeColor(letterGrade) {
        if (letterGrade === "9") return "bg-purple-100 text-purple-800";
        if (letterGrade === "8") return "bg-blue-100 text-blue-800";
        if (letterGrade === "7") return "bg-green-100 text-green-800";
        if (letterGrade === "6") return "bg-yellow-100 text-yellow-800";
        if (letterGrade === "5") return "bg-orange-100 text-orange-800";
        if (letterGrade === "4") return "bg-red-100 text-red-800";
        if (letterGrade === "3") return "bg-gray-100 text-gray-800";
        return "bg-gray-100 text-gray-800";
    }
    
    getProgressColor(letterGrade) {
        if (letterGrade === "9") return "bg-purple-500";
        if (letterGrade === "8") return "bg-blue-500";
        if (letterGrade === "7") return "bg-green-500";
        if (letterGrade === "6") return "bg-yellow-500";
        if (letterGrade === "5") return "bg-orange-500";
        if (letterGrade === "4") return "bg-red-500";
        if (letterGrade === "3") return "bg-gray-500";
        return "bg-gray-500";
    }
    
    updateTotalMarksDisplay() {
        const display = document.getElementById('total-marks-display');
        if (display) {
            display.textContent = `Total: ${this.totalMarks} marks`;
        }
    }
    
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 
            type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
            'bg-blue-100 border border-blue-400 text-blue-700'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
let calculator;

function switchTab(mode) {
    calculator.calculationMode = mode;
    
    // Update tab buttons
    const genericTab = document.getElementById('generic-tab');
    const dataDrivenTab = document.getElementById('data-driven-tab');
    const genericContent = document.getElementById('generic-content');
    const dataDrivenContent = document.getElementById('data-driven-content');
    const modeBadge = document.getElementById('calculation-mode-badge');
    
    if (mode === 'generic') {
        genericTab.className = genericTab.className.replace('text-gray-600', 'text-white bg-white text-gray-900 shadow-sm');
        dataDrivenTab.className = dataDrivenTab.className.replace('text-white bg-white text-gray-900 shadow-sm', 'text-gray-600');
        genericContent.classList.remove('hidden');
        dataDrivenContent.classList.add('hidden');
        modeBadge.classList.add('hidden');
    } else {
        dataDrivenTab.className = dataDrivenTab.className.replace('text-gray-600', 'text-white bg-white text-gray-900 shadow-sm');
        genericTab.className = genericTab.className.replace('text-white bg-white text-gray-900 shadow-sm', 'text-gray-600');
        dataDrivenContent.classList.remove('hidden');
        genericContent.classList.add('hidden');
        modeBadge.classList.remove('hidden');
    }
    
    // Recalculate if boundaries already exist
    if (calculator.gradeBoundaries.length > 0) {
        calculator.calculateBoundaries();
    }
}

function calculateGenericBoundaries() {
    calculator.calculationMode = 'generic';
    calculator.calculateBoundaries();
    calculator.showNotification('Generic boundaries calculated successfully', 'success');
}

function loadSampleScores() {
    const sampleScores = "95, 89, 87, 84, 82, 78, 76, 73, 71, 68, 65, 62, 58, 55, 52, 48, 45, 42, 38, 35, 32, 28, 25, 22, 18, 15, 12, 8, 5, 2";
    const scoreInput = document.getElementById('scoreInput');
    if (scoreInput) {
        scoreInput.value = sampleScores;
        calculator.validateInput();
    }
}

function addScores() {
    const scoreInput = document.getElementById('scoreInput');
    if (!scoreInput || !scoreInput.value.trim()) return;
    
    // Check for PII before processing
    const piiCheck = calculator.validatePII(scoreInput.value);
    if (piiCheck.length > 0) {
        calculator.showNotification('Personal Information Detected: Please remove names, usernames, and identifiers before saving', 'error');
        return;
    }
    
    try {
        const scores = scoreInput.value
            .split(/[\n,\s]+/)
            .map(s => s.trim())
            .filter(s => s !== "")
            .map(s => {
                const score = parse