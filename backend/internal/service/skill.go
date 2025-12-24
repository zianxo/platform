package service

import (
	"context"

	"github.com/dubai/platform/backend/internal/db"
	"github.com/dubai/platform/backend/internal/models"
)

type SkillService struct{}

func NewSkillService() *SkillService {
	return &SkillService{}
}

func (s *SkillService) List(ctx context.Context) ([]models.Skill, error) {
	query := `SELECT id, name, category FROM skills ORDER BY name`
	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []models.Skill
	for rows.Next() {
		var sk models.Skill
		err := rows.Scan(&sk.ID, &sk.Name, &sk.Category)
		if err != nil {
			return nil, err
		}
		skills = append(skills, sk)
	}
	return skills, nil
}

func (s *SkillService) Create(ctx context.Context, sk *models.Skill) error {
	query := `INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING id`
	return db.Pool.QueryRow(ctx, query, sk.Name, sk.Category).Scan(&sk.ID)
}

func (s *SkillService) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM skills WHERE id = $1`
	_, err := db.Pool.Exec(ctx, query, id)
	return err
}

func (s *SkillService) UpdateCategory(ctx context.Context, oldName, newName string) error {
	query := `UPDATE skills SET category = $1 WHERE category = $2`
	_, err := db.Pool.Exec(ctx, query, newName, oldName)
	return err
}
