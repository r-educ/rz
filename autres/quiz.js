<section class="section">
    <h2>📝 Quiz Excel</h2>
    <div id="quiz">
        <p><strong>Question : Quelle formule permet de calculer la moyenne des cellules A1 à A10 ?</strong></p>
        <button onclick="verifierReponse('moyenne')">=MOYENNE(A1:A10)</button>
        <button onclick="verifierReponse('somme')">=SOMME(A1:A10)</button>
        <button onclick="verifierReponse('moy')">=MOY(A1:A10)</button>
        <p id="resultat"></p>
    </div>
    <script>
        function verifierReponse(reponse) {
            const resultat = document.getElementById('resultat');
            if (reponse === 'moyenne') {
                resultat.innerHTML = '✅ Bravo ! C\'est la bonne réponse.';
                resultat.style.color = 'green';
            } else {
                resultat.innerHTML = '❌ Essaie encore !';
                resultat.style.color = 'red';
            }
        }
    </script>
</section>
