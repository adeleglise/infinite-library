# Infinite Library — Development Tracker

## ✅ Phase 1 — Fondations (Complété)
- [x] Structure Next.js 16 + Zustand
- [x] Système de ressources (glyphs)
- [x] 7 générateurs (Plume → Tour de Babel)
- [x] Sérialisation Decimal (break_infinity.js)
- [x] Bibliothèque pixel art animée
- [x] Notes API avec persistance S3
- [x] Thème parchemin clair
- [x] Déploiement Coolify

## 🔄 Phase 2 — Upgrades (En cours)
- [ ] Système d'upgrades permanent
- [ ] Upgrades de click power
- [ ] Upgrades de production par générateur
- [ ] Upgrades globaux (multiplicateurs)
- [ ] UI panel upgrades
- [ ] Déblocage progressif des upgrades

## 📋 Phase 3 — Prestige & Progression
- [ ] Améliorer système prestige (vocables)
- [ ] Bonus de vocables sur production
- [ ] Deuxième couche prestige (fragments → codex)
- [ ] Prestige milestones (bonus permanents)

## 📋 Phase 4 — Contenu & Polish
- [ ] Achievements / Succès
- [ ] Statistiques détaillées
- [ ] Notifications de milestones
- [ ] Animations de déblocage
- [ ] Sons optionnels

## 📋 Phase 5 — Endgame
- [ ] Générateurs tier 2 (post-Babel)
- [ ] Méta-progression
- [ ] Secrets / Easter eggs Borges

---

## Notes de développement

### 2026-01-31 — Début Phase 2
Objectif: Implémenter le système d'upgrades

Structure prévue:
```typescript
interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: Decimal;
  currency: 'glyphs' | 'vocables';
  effect: () => void;
  unlockCondition: () => boolean;
  purchased: boolean;
  icon: string;
}
```

Catégories d'upgrades:
1. **Click** — Augmente le pouvoir de clic
2. **Generator** — Boost un générateur spécifique
3. **Global** — Multiplicateur sur toute la production
4. **Synergy** — Bonus basé sur d'autres éléments
